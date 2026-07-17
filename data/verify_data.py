import os
import sys
import random
import numpy as np
import pandas as pd
import cv2

def verify_pose(data_dir: str) -> bool:
    print("\n--- Verifying Pose Datasets ---")
    processed_pose_dir = os.path.join(data_dir, "processed", "pose")
    splits = ["train", "val"]
    
    debug_plots_dir = os.path.join(data_dir, "processed", "debug_plots")
    os.makedirs(debug_plots_dir, exist_ok=True)
    
    all_ok = True
    total_images_checked = 0
    total_labels_checked = 0
    
    sample_to_plot = []
    
    for split in splits:
        img_dir = os.path.join(processed_pose_dir, split, "images")
        lbl_dir = os.path.join(processed_pose_dir, split, "labels")
        
        if not os.path.exists(img_dir) or not os.path.exists(lbl_dir):
            print(f"Warning: split directory missing for {split}")
            all_ok = False
            continue
            
        images = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.png'))]
        labels = [f for f in os.listdir(lbl_dir) if f.endswith('.txt')]
        
        print(f"Split [{split}]: Found {len(images)} images and {len(labels)} labels.")
        
        for img_file in images:
            total_images_checked += 1
            base_name = os.path.splitext(img_file)[0]
            lbl_file = f"{base_name}.txt"
            lbl_path = os.path.join(lbl_dir, lbl_file)
            
            if not os.path.exists(lbl_path):
                print(f"Error: Missing label file for image {img_file}")
                all_ok = False
                continue
                
            total_labels_checked += 1
            
            # Read label file
            try:
                with open(lbl_path, "r") as f:
                    lines = f.readlines()
                    
                if len(lines) == 0:
                    print(f"Error: Label file is empty: {lbl_file}")
                    all_ok = False
                    continue
                    
                for line_idx, line in enumerate(lines):
                    parts = line.strip().split()
                    # YOLO pose: class + 4 bbox coords + 24 * 3 keypoint coords = 77
                    if len(parts) != 77:
                        print(f"Error: {lbl_file} has {len(parts)} tokens instead of 77.")
                        all_ok = False
                        continue
                        
                    class_idx = int(parts[0])
                    bbox = [float(x) for x in parts[1:5]]
                    kpts = [float(x) for x in parts[5:]]
                    
                    if class_idx != 0:
                        print(f"Error: {lbl_file} class index is {class_idx} instead of 0.")
                        all_ok = False
                        
                    # Check bbox bounds
                    for val in bbox:
                        if not (0.0 <= val <= 1.0):
                            print(f"Error: {lbl_file} has out-of-bounds bbox value: {val}")
                            all_ok = False
                            
                    # Check keypoint bounds
                    for i in range(24):
                        kx = kpts[i*3]
                        ky = kpts[i*3+1]
                        vis = int(kpts[i*3+2])
                        
                        if vis not in [0, 1, 2]:
                            print(f"Error: {lbl_file} joint {i} has invalid visibility {vis}")
                            all_ok = False
                            
                        if vis > 0:
                            if not (0.0 <= kx <= 1.0) or not (0.0 <= ky <= 1.0):
                                print(f"Error: {lbl_file} joint {i} has out-of-bounds coords: ({kx}, {ky})")
                                all_ok = False
                                
                    if len(sample_to_plot) < 3:
                        sample_to_plot.append((os.path.join(img_dir, img_file), bbox, kpts))
            except Exception as e:
                print(f"Error reading label file {lbl_file}: {e}")
                all_ok = False
                
    # Generate visual debug plots for pose
    for idx, (img_path, bbox, kpts) in enumerate(sample_to_plot):
        img = cv2.imread(img_path)
        if img is None:
            continue
        H, W, _ = img.shape
        
        # Draw bbox
        xc, yc, w, h = bbox
        x0 = int((xc - w/2) * W)
        y0 = int((yc - h/2) * H)
        x1 = int((xc + w/2) * W)
        y1 = int((yc + h/2) * H)
        cv2.rectangle(img, (x0, y0), (x1, y1), (0, 255, 0), 2)
        
        # Draw keypoints
        for i in range(24):
            kx = int(kpts[i*3] * W)
            ky = int(kpts[i*3+1] * H)
            vis = int(kpts[i*3+2])
            
            if vis == 2:
                # Fully visible - Green dot
                cv2.circle(img, (kx, ky), 4, (0, 255, 0), -1)
            elif vis == 1:
                # Occluded - Yellow dot
                cv2.circle(img, (kx, ky), 4, (0, 255, 255), -1)
                
        plot_path = os.path.join(debug_plots_dir, f"pose_debug_{idx}.png")
        cv2.imwrite(plot_path, img)
        print(f"Pose debug plot saved to: {plot_path}")
        
    if all_ok:
        print(f"SUCCESS: Pose verification complete. Checked {total_images_checked} images and labels.")
    else:
        print("FAILURE: Pose verification failed.")
    return all_ok

def verify_audio(data_dir: str) -> bool:
    print("\n--- Verifying Audio Datasets ---")
    processed_audio_dir = os.path.join(data_dir, "processed", "audio")
    csv_path = os.path.join(processed_audio_dir, "labels.csv")
    spectrograms_dir = os.path.join(processed_audio_dir, "spectrograms")
    
    debug_plots_dir = os.path.join(data_dir, "processed", "debug_plots")
    os.makedirs(debug_plots_dir, exist_ok=True)
    
    if not os.path.exists(csv_path):
        print(f"Error: Unified labels CSV file not found at {csv_path}")
        return False
        
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error loading {csv_path}: {e}")
        return False
        
    # Verify columns
    expected_cols = {"filename", "source", "vocalization_class", "arousal", "valence"}
    if not expected_cols.issubset(df.columns):
        print(f"Error: CSV is missing some required columns. Found: {list(df.columns)}")
        return False
        
    all_ok = True
    checked_files = 0
    sample_to_plot = []
    
    for idx, row in df.iterrows():
        filename = row["filename"]
        npy_path = os.path.join(spectrograms_dir, filename)
        
        if not os.path.exists(npy_path):
            print(f"Error: Spectrogram file not found: {npy_path}")
            all_ok = False
            continue
            
        checked_files += 1
        
        # Load and verify array
        try:
            arr = np.load(npy_path)
            # Check shape
            if arr.shape != (128, 128):
                print(f"Error: {filename} has shape {arr.shape} instead of (128, 128)")
                all_ok = False
                
            # Check for NaNs/Infs
            if np.isnan(arr).any() or np.isinf(arr).any():
                print(f"Error: {filename} contains NaN or Inf values.")
                all_ok = False
                
            # Check bounds [0.0, 1.0]
            if arr.min() < -1e-6 or arr.max() > 1.0 + 1e-6:
                print(f"Error: {filename} values out of [0, 1] range: [{arr.min():.4f}, {arr.max():.4f}]")
                all_ok = False
                
            if len(sample_to_plot) < 3:
                sample_to_plot.append((filename, arr))
        except Exception as e:
            print(f"Error loading numpy array {filename}: {e}")
            all_ok = False
            
    # Generate visual debug plots for spectrograms
    for filename, arr in sample_to_plot:
        # Scale to 0-255 for cv2 image
        gray_img = (arr * 255.0).astype(np.uint8)
        # Apply colormap to make it look like a nice heatmap (e.g. viridis)
        color_img = cv2.applyColorMap(gray_img, cv2.COLORMAP_VIRIDIS)
        
        # Upscale for better visibility
        color_img_resized = cv2.resize(color_img, (512, 512), interpolation=cv2.INTER_NEAREST)
        
        base_name = os.path.splitext(filename)[0]
        plot_path = os.path.join(debug_plots_dir, f"{base_name}_debug.png")
        cv2.imwrite(plot_path, color_img_resized)
        print(f"Audio debug plot saved to: {plot_path}")
        
    if all_ok:
        print(f"SUCCESS: Audio verification complete. Checked {checked_files} spectrograms.")
    else:
        print("FAILURE: Audio verification failed.")
    return all_ok

def main():
    data_dir = os.path.dirname(os.path.abspath(__file__))
    pose_ok = verify_pose(data_dir)
    audio_ok = verify_audio(data_dir)
    
    if pose_ok and audio_ok:
        print("\n=== VERIFICATION STATUS: PASSED ===")
        sys.exit(0)
    else:
        print("\n=== VERIFICATION STATUS: FAILED ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
