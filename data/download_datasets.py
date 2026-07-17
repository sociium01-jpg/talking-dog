import os
import sys
import json
import argparse
import urllib.request
import struct
import wave
import numpy as np
import cv2
from tqdm import tqdm

def generate_mock_wav(filename: str, duration: float = 2.0, sr: int = 22050, freq: float = 440.0):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Generate sine wave sound
    data = np.sin(2 * np.pi * freq * t) * 32767
    pcm_data = struct.pack('<' + 'h' * len(data), *data.astype(np.int16))
    
    with wave.open(filename, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2) # 16-bit
        w.setframerate(sr)
        w.writeframes(pcm_data)

def generate_mock_image(filename: str, width: int = 640, height: int = 480):
    # Create a solid color image with some shapes drawn
    img = np.zeros((height, width, 3), dtype=np.uint8)
    img[:, :] = [100, 150, 100]  # Dark green background
    # Draw a mock dog (a circle and rectangle)
    cv2.circle(img, (width // 2, height // 2), 50, (50, 50, 200), -1)  # Body
    cv2.rectangle(img, (width // 2 - 20, height // 2 - 80), (width // 2 + 20, height // 2 - 40), (100, 100, 250), -1)  # Head
    cv2.imwrite(filename, img)

def setup_mock_data(base_dir: str):
    print("Setting up mock datasets for local testing...")
    
    # 1. StanfordExtra Mock
    se_dir = os.path.join(base_dir, "raw", "stanford_extra")
    os.makedirs(se_dir, exist_ok=True)
    
    # Create mock raw images
    images_dir = os.path.join(se_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    
    annotations = []
    for i in range(5):
        img_name = f"dog_{i}.jpg"
        img_path = os.path.join(images_dir, img_name)
        generate_mock_image(img_path)
        
        # 24 joints: list of [x, y, visibility]
        # In StanfordExtra: [x, y, vis] where vis is 0 (occluded/not visible) or 1 (visible)
        joints = []
        for j in range(24):
            # Place joints in a circular pattern around image center for mock keypoints
            angle = j * (2 * np.pi / 24)
            jx = int(320 + 80 * np.cos(angle))
            jy = int(240 + 80 * np.sin(angle))
            vis = 1 if j % 5 != 0 else 0  # mock some occluded joints
            joints.append([jx, jy, vis])
            
        annotations.append({
            "img_path": f"images/{img_name}",
            "img_width": 640,
            "img_height": 480,
            "img_bbox": [200, 100, 240, 280],  # [x, y, w, h]
            "joints": joints,
            "is_multiple_dogs": False
        })
        
    with open(os.path.join(se_dir, "StanfordExtra_v12.json"), "w") as f:
        json.dump(annotations, f, indent=4)
    print("StanfordExtra mock created successfully.")
    
    # 2. Dog-Pose Mock (Standard YOLO pose format)
    dp_dir = os.path.join(base_dir, "raw", "dog_pose")
    for split in ["train", "val"]:
        split_img_dir = os.path.join(dp_dir, split, "images")
        split_lbl_dir = os.path.join(dp_dir, split, "labels")
        os.makedirs(split_img_dir, exist_ok=True)
        os.makedirs(split_lbl_dir, exist_ok=True)
        
        for i in range(3):
            img_name = f"dp_{split}_{i}.jpg"
            img_path = os.path.join(split_img_dir, img_name)
            generate_mock_image(img_path)
            
            # Write matching YOLO label txt file:
            # class_idx center_x center_y width height k1_x k1_y k1_vis ... (24 keypoints)
            # Visibility in YOLO: 0 (not visible), 1 (occluded), 2 (visible)
            lbl_name = f"dp_{split}_{i}.txt"
            lbl_path = os.path.join(split_lbl_dir, lbl_name)
            
            # Mock YOLO bounding box
            line_parts = ["0", "0.5", "0.5", "0.4", "0.6"]
            for j in range(24):
                angle = j * (2 * np.pi / 24)
                kx = 0.5 + 0.15 * np.cos(angle)
                ky = 0.5 + 0.15 * np.sin(angle)
                vis = 2 if j % 5 != 0 else 0
                line_parts.extend([f"{kx:.4f}", f"{ky:.4f}", str(vis)])
                
            with open(lbl_path, "w") as f:
                f.write(" ".join(line_parts) + "\n")
    print("Dog-Pose mock created successfully.")
    
    # 3. AudioSet Mock
    as_dir = os.path.join(base_dir, "raw", "audioset")
    os.makedirs(as_dir, exist_ok=True)
    
    # Create raw audio folder
    as_audio_dir = os.path.join(as_dir, "audio")
    os.makedirs(as_audio_dir, exist_ok=True)
    
    as_metadata = []
    classes = ["bark", "growl", "howl", "whimper", "yip"]
    for i in range(5):
        filename = f"as_clip_{i}.wav"
        generate_mock_wav(os.path.join(as_audio_dir, filename), freq=300.0 + i*50.0)
        as_metadata.append({
            "yt_id": f"dummy_yt_{i}",
            "start_time": 0.0,
            "end_time": 2.0,
            "filename": filename,
            "class": classes[i % len(classes)]
        })
    with open(os.path.join(as_dir, "metadata.json"), "w") as f:
        json.dump(as_metadata, f, indent=4)
    print("AudioSet mock created successfully.")

    # 4. EmotionalCanines Mock
    ec_dir = os.path.join(base_dir, "raw", "emotional_canines")
    os.makedirs(ec_dir, exist_ok=True)
    
    ec_audio_dir = os.path.join(ec_dir, "audio")
    os.makedirs(ec_audio_dir, exist_ok=True)
    
    # CSV file matching files to arousal/valence
    csv_rows = ["filename,breed,arousal,valence,class"]
    breeds = ["Husky", "Shiba"]
    classes = ["bark", "growl", "whimper"]
    for i in range(6):
        filename = f"ec_clip_{i}.wav"
        generate_mock_wav(os.path.join(ec_audio_dir, filename), freq=400.0 - i*40.0)
        # Mock arousal and valence between 0.0 and 1.0
        arousal = round(0.2 + 0.1 * i, 2)
        valence = round(0.8 - 0.1 * i, 2)
        breed = breeds[i % len(breeds)]
        cls = classes[i % len(classes)]
        csv_rows.append(f"{filename},{breed},{arousal},{valence},{cls}")
        
    with open(os.path.join(ec_dir, "labels.csv"), "w") as f:
        f.write("\n".join(csv_rows) + "\n")
    print("EmotionalCanines mock created successfully.")

def download_file(url: str, dest_folder: str) -> str:
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)
    
    filename = url.split('/')[-1]
    local_filename = os.path.join(dest_folder, filename)
    print(f"Downloading {url} to {local_filename}...")
    
    # Simple chunked download with progress bar using tqdm
    try:
        response = urllib.request.urlopen(url)
        meta = response.info()
        file_size = int(meta.get("Content-Length", 0))
        
        with open(local_filename, 'wb') as f, tqdm(
            total=file_size, unit='B', unit_scale=True, desc=filename
        ) as bar:
            while True:
                buffer = response.read(8192)
                if not buffer:
                    break
                f.write(buffer)
                bar.update(len(buffer))
        return local_filename
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return ""

def main():
    parser = argparse.ArgumentParser(description="Dataset Download and Setup Manager")
    parser.add_argument(
        "--mode",
        choices=["real", "mock"],
        default="mock",
        help="Download real datasets or generate small mock datasets for testing"
    )
    args = parser.parse_args()
    
    # Base folder is the parent folder of this script (/data)
    data_dir = os.path.dirname(os.path.abspath(__file__))
    
    if args.mode == "mock":
        setup_mock_data(data_dir)
        print("Mock setup completed successfully!")
    else:
        print("Starting real dataset downloads...")
        
        # 1. Download StanfordExtra Annotations JSON
        se_url = "https://raw.githubusercontent.com/benjiebob/StanfordExtra/master/annotations/StanfordExtra_v12.json"
        se_dir = os.path.join(data_dir, "raw", "stanford_extra")
        download_file(se_url, se_dir)
        
        # 2. Stanford Dogs Dataset (Raw Images tar)
        sd_url = "http://vision.stanford.edu/aditya86/ImageNetDogs/images.tar"
        print(f"To download Stanford Dogs raw images, use the following URL: {sd_url}")
        print("Due to the size (~750MB), you can download it manually and extract it to /data/raw/stanford_extra/images/")
        
        # 3. EmotionalCanines Dataset
        ec_drive_url = "https://drive.google.com/file/d/1QXxHqpYL7Q1TR5tdvAHm8tV2BdZgpGOc/view"
        print(f"To download the EmotionalCanines dataset, fetch it from: {ec_drive_url}")
        print("Extract files to /data/raw/emotional_canines/")
        
        # 4. AudioSet
        print("For AudioSet, download segments using yt-dlp based on class ontology 'Bark' (mid: /m/0bt9lr).")
        
        print("\nReal download script scaffold ready. Run with default '--mode mock' to execute pipeline verification.")

if __name__ == "__main__":
    main()
