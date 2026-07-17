import os
import sys
import json
import random
import numpy as np
import pandas as pd
import cv2
import librosa
from tqdm import tqdm

def preprocess_pose(data_dir: str):
    print("\n--- Preprocessing Pose Datasets ---")
    
    # Define splits paths
    splits = ["train", "val"]
    processed_pose_dir = os.path.join(data_dir, "processed", "pose")
    for split in splits:
        os.makedirs(os.path.join(processed_pose_dir, split, "images"), exist_ok=True)
        os.makedirs(os.path.join(processed_pose_dir, split, "labels"), exist_ok=True)
        
    random.seed(42)
    
    # 1. Process StanfordExtra
    se_raw_dir = os.path.join(data_dir, "raw", "stanford_extra")
    se_json_path = os.path.join(se_raw_dir, "StanfordExtra_v12.json")
    
    if os.path.exists(se_json_path):
        print(f"Processing StanfordExtra annotations from {se_json_path}...")
        with open(se_json_path, "r") as f:
            annotations = json.load(f)
            
        for ann in tqdm(annotations, desc="StanfordExtra"):
            img_rel_path = ann["img_path"]
            img_abs_path = os.path.join(se_raw_dir, img_rel_path)
            
            if not os.path.exists(img_abs_path):
                print(f"Warning: Image not found: {img_abs_path}")
                continue
                
            # Load image to verify dimensions
            img = cv2.imread(img_abs_path)
            if img is None:
                print(f"Warning: Could not read image: {img_abs_path}")
                continue
                
            H, W, _ = img.shape
            bbox = ann["img_bbox"]  # [x0, y0, w, h]
            joints = ann["joints"]  # 24 joints: [x, y, vis]
            
            # Map bbox to normalized YOLO:
            # x_center, y_center, width, height (normalized to [0, 1])
            x0, y0, w, h = bbox
            x_center = (x0 + w / 2.0) / W
            y_center = (y0 + h / 2.0) / H
            w_norm = w / W
            h_norm = h / H
            
            # Clamp bbox values
            x_center = max(0.0, min(1.0, x_center))
            y_center = max(0.0, min(1.0, y_center))
            w_norm = max(0.0, min(1.0, w_norm))
            h_norm = max(0.0, min(1.0, h_norm))
            
            # Format keypoints
            yolo_kpts = []
            for jx, jy, vis in joints:
                if vis > 0:
                    # Visible joint
                    k_x = max(0.0, min(1.0, jx / W))
                    k_y = max(0.0, min(1.0, jy / H))
                    k_vis = 2  # fully visible in YOLOv8
                else:
                    # Occluded / invisible joint
                    k_x = 0.0
                    k_y = 0.0
                    k_vis = 0  # not visible
                yolo_kpts.extend([f"{k_x:.5f}", f"{k_y:.5f}", str(k_vis)])
                
            label_line = f"0 {x_center:.5f} {y_center:.5f} {w_norm:.5f} {h_norm:.5f} " + " ".join(yolo_kpts)
            
            # Determine split
            split = "val" if random.random() < 0.2 else "train"
            
            # Copy image
            img_filename = os.path.basename(img_abs_path)
            out_img_path = os.path.join(processed_pose_dir, split, "images", img_filename)
            cv2.imwrite(out_img_path, img)
            
            # Write label file
            base_name = os.path.splitext(img_filename)[0]
            out_lbl_path = os.path.join(processed_pose_dir, split, "labels", f"{base_name}.txt")
            with open(out_lbl_path, "w") as f_lbl:
                f_lbl.write(label_line + "\n")
    else:
        print("StanfordExtra raw dataset not found. Skipping...")
        
    # 2. Process Dog-Pose
    dp_raw_dir = os.path.join(data_dir, "raw", "dog_pose")
    if os.path.exists(dp_raw_dir):
        print(f"Processing Dog-Pose annotations from {dp_raw_dir}...")
        for split in splits:
            raw_split_img_dir = os.path.join(dp_raw_dir, split, "images")
            raw_split_lbl_dir = os.path.join(dp_raw_dir, split, "labels")
            
            if not os.path.exists(raw_split_img_dir) or not os.path.exists(raw_split_lbl_dir):
                continue
                
            label_files = [f for f in os.listdir(raw_split_lbl_dir) if f.endswith(".txt")]
            for lbl_file in label_files:
                lbl_abs_path = os.path.join(raw_split_lbl_dir, lbl_file)
                base_name = os.path.splitext(lbl_file)[0]
                
                # Check for matching image (.jpg or .png)
                img_file = f"{base_name}.jpg"
                img_abs_path = os.path.join(raw_split_img_dir, img_file)
                if not os.path.exists(img_abs_path):
                    img_file = f"{base_name}.png"
                    img_abs_path = os.path.join(raw_split_img_dir, img_file)
                    
                if not os.path.exists(img_abs_path):
                    print(f"Warning: Matching image for label {lbl_file} not found. Skipping...")
                    continue
                    
                # Read image
                img = cv2.imread(img_abs_path)
                if img is None:
                    continue
                    
                # Write image to processed folder
                out_img_path = os.path.join(processed_pose_dir, split, "images", f"{base_name}.jpg")
                cv2.imwrite(out_img_path, img)
                
                # Read and copy label file directly
                with open(lbl_abs_path, "r") as f_in:
                    content = f_in.read()
                    
                out_lbl_path = os.path.join(processed_pose_dir, split, "labels", f"{base_name}.txt")
                with open(out_lbl_path, "w") as f_out:
                    f_out.write(content)
    else:
        print("Dog-Pose raw dataset not found. Skipping...")

def process_audio_file(audio_path: str, output_npy_path: str) -> bool:
    try:
        # Load audio, standard resampling to 22.05 kHz mono
        y, sr = librosa.load(audio_path, sr=22050, mono=True)
        
        # Ensure duration is exactly 2.0s (44,100 samples)
        target_samples = 44100
        if len(y) > target_samples:
            y = y[:target_samples]
        elif len(y) < target_samples:
            y = np.pad(y, (0, target_samples - len(y)), mode='constant')
            
        # Compute mel-spectrogram
        # hop_length=345 yields exactly 128 frames for 44,100 samples (44100/345 = 127.8 -> 128 frames)
        melspec = librosa.feature.melspectrogram(
            y=y, sr=sr, n_fft=1024, hop_length=345, n_mels=128
        )
        
        # Convert to dB scale
        log_melspec = librosa.power_to_db(melspec, ref=np.max)
        
        # Crop or pad to exactly (128, 128) just in case
        if log_melspec.shape[1] > 128:
            log_melspec = log_melspec[:, :128]
        elif log_melspec.shape[1] < 128:
            log_melspec = np.pad(log_melspec, ((0, 0), (0, 128 - log_melspec.shape[1])), mode='constant')
            
        # Min-max normalization to [0, 1] range
        min_val = log_melspec.min()
        max_val = log_melspec.max()
        if max_val - min_val > 1e-6:
            norm_melspec = (log_melspec - min_val) / (max_val - min_val)
        else:
            norm_melspec = np.zeros_like(log_melspec)
            
        # Save as numpy array file
        np.save(output_npy_path, norm_melspec)
        return True
    except Exception as e:
        print(f"Error processing audio file {audio_path}: {e}")
        return False

def preprocess_audio(data_dir: str):
    print("\n--- Preprocessing Audio Datasets ---")
    
    processed_audio_dir = os.path.join(data_dir, "processed", "audio")
    spectrograms_dir = os.path.join(processed_audio_dir, "spectrograms")
    os.makedirs(spectrograms_dir, exist_ok=True)
    
    labels_records = []
    
    # 1. Process AudioSet
    as_raw_dir = os.path.join(data_dir, "raw", "audioset")
    as_meta_path = os.path.join(as_raw_dir, "metadata.json")
    
    if os.path.exists(as_meta_path):
        print(f"Processing AudioSet metadata from {as_meta_path}...")
        with open(as_meta_path, "r") as f:
            metadata = json.load(f)
            
        for clip in tqdm(metadata, desc="AudioSet"):
            filename = clip["filename"]
            raw_audio_path = os.path.join(as_raw_dir, "audio", filename)
            
            if not os.path.exists(raw_audio_path):
                print(f"Warning: Audio file not found: {raw_audio_path}")
                continue
                
            base_name = os.path.splitext(filename)[0]
            out_npy_name = f"as_{base_name}.npy"
            out_npy_path = os.path.join(spectrograms_dir, out_npy_name)
            
            if process_audio_file(raw_audio_path, out_npy_path):
                labels_records.append({
                    "filename": out_npy_name,
                    "source": "audioset",
                    "vocalization_class": clip["class"],
                    "arousal": 0.5,  # default neutral
                    "valence": 0.5   # default neutral
                })
    else:
        print("AudioSet raw metadata not found. Skipping...")
        
    # 2. Process EmotionalCanines
    ec_raw_dir = os.path.join(data_dir, "raw", "emotional_canines")
    ec_csv_path = os.path.join(ec_raw_dir, "labels.csv")
    
    if os.path.exists(ec_csv_path):
        print(f"Processing EmotionalCanines metadata from {ec_csv_path}...")
        df = pd.read_csv(ec_csv_path)
        
        for idx, row in tqdm(df.iterrows(), desc="EmotionalCanines", total=len(df)):
            filename = row["filename"]
            raw_audio_path = os.path.join(ec_raw_dir, "audio", filename)
            
            if not os.path.exists(raw_audio_path):
                print(f"Warning: Audio file not found: {raw_audio_path}")
                continue
                
            base_name = os.path.splitext(filename)[0]
            out_npy_name = f"ec_{base_name}.npy"
            out_npy_path = os.path.join(spectrograms_dir, out_npy_name)
            
            if process_audio_file(raw_audio_path, out_npy_path):
                labels_records.append({
                    "filename": out_npy_name,
                    "source": "emotional_canines",
                    "vocalization_class": row["class"] if "class" in df.columns else "bark",
                    "arousal": float(row["arousal"]),
                    "valence": float(row["valence"])
                })
    else:
        print("EmotionalCanines raw labels.csv not found. Skipping...")
        
    # Write unified labels CSV file
    if labels_records:
        out_csv_path = os.path.join(processed_audio_dir, "labels.csv")
        df_out = pd.DataFrame(labels_records)
        df_out.to_csv(out_csv_path, index=False)
        print(f"Unified labels CSV saved to {out_csv_path} with {len(df_out)} processed files.")
    else:
        print("No audio clips processed. Unified labels CSV not created.")

if __name__ == "__main__":
    data_dir = os.path.dirname(os.path.abspath(__file__))
    preprocess_pose(data_dir)
    preprocess_audio(data_dir)
    print("\nPreprocessing pipeline execution finished successfully.")
