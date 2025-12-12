#!/usr/bin/env python3
"""
Exploratory script for Human MTL Units WM dataset from GIN.

This script explores the HDF5/NIX file structure to locate:
1. Electrode MNI coordinates
2. Electrode labels/names
3. Anatomical location labels

Based on the MATLAB script Load_Data_Example_Script.m, we expect:
- Group: 'iEEG electrode information'
- MNI Coordinates: accessed via multiTags retrieveFeatureData
- Electrode labels: in sources

Reference MATLAB code (lines 208-213):
    groupiEEGElecrodes = block.openGroup('iEEG electrode information');
    groupiEEGElecrodes.multiTags{1}.retrieveFeatureData(nElectrode,'iEEG_Electrode_MNI_Coordinates')
"""

import h5py
import numpy as np
import sys

def explore_hdf5_structure(file_path, max_depth=5):
    """
    Recursively explore HDF5 file structure.
    """
    print(f"[EXPLORE] Opening: {file_path}")
    print("=" * 80)

    with h5py.File(file_path, 'r') as f:
        print(f"\n[TOP LEVEL] Keys: {list(f.keys())}\n")

        # Recursively print structure
        def print_structure(name, obj, depth=0):
            if depth > max_depth:
                return
            indent = "  " * depth
            if isinstance(obj, h5py.Group):
                print(f"{indent}GROUP: {name}")
                # Try to print keys if they exist
                try:
                    keys = list(obj.keys())
                    if keys:
                        print(f"{indent}  └─ keys: {keys[:10]}{'...' if len(keys) > 10 else ''}")
                except:
                    pass
            elif isinstance(obj, h5py.Dataset):
                print(f"{indent}DATASET: {name}")
                print(f"{indent}  └─ shape: {obj.shape}, dtype: {obj.dtype}")
                # Print a few values if small
                if obj.size < 20 and obj.size > 0:
                    try:
                        print(f"{indent}  └─ values: {obj[()]}")
                    except:
                        pass

        print("\n[STRUCTURE]")
        f.visititems(print_structure)

        print("\n" + "=" * 80)
        print("\n[SEARCHING FOR ELECTRODE INFO]")

        # Look for electrode-related groups
        electrode_keywords = ['electrode', 'elec', 'iEEG', 'channel', 'montage', 'mni', 'coord']
        found_groups = []

        def find_electrode_groups(name, obj):
            if isinstance(obj, h5py.Group):
                for keyword in electrode_keywords:
                    if keyword.lower() in name.lower():
                        found_groups.append(name)
                        break

        f.visititems(find_electrode_groups)

        if found_groups:
            print(f"[FOUND] Electrode-related groups:")
            for group_path in found_groups:
                print(f"  - {group_path}")
        else:
            print("[WARNING] No electrode-related groups found with keywords")

        # Based on MATLAB code, look specifically for 'data/block_0/groups/iEEG electrode information'
        # NIX format typically uses: /data/block_0/...
        print("\n[SEARCHING BLOCK STRUCTURE]")
        if 'data' in f:
            data_group = f['data']
            print(f"[FOUND] 'data' group with keys: {list(data_group.keys())}")

            # Look for blocks
            for key in data_group.keys():
                if 'block' in key.lower():
                    block = data_group[key]
                    print(f"\n[BLOCK] {key}")
                    print(f"  Keys: {list(block.keys())[:20]}")

                    # Look for groups within block
                    if 'groups' in block:
                        groups = block['groups']
                        print(f"\n  [GROUPS] Keys: {list(groups.keys())[:20]}")

                        # Look for iEEG electrode information
                        for group_key in groups.keys():
                            if 'electrode' in group_key.lower() or 'ieeg' in group_key.lower():
                                elec_group = groups[group_key]
                                print(f"\n  [ELECTRODE GROUP] {group_key}")
                                print(f"    Keys: {list(elec_group.keys())}")

                                # Explore multi_tags (MATLAB uses multiTags)
                                if 'multi_tags' in elec_group:
                                    print(f"\n    [MULTI_TAGS] Exploring...")
                                    multi_tags = elec_group['multi_tags']
                                    print(f"      Keys: {list(multi_tags.keys())[:10]}")

                                    # Try to access first multi_tag
                                    for mt_key in list(multi_tags.keys())[:3]:
                                        mt = multi_tags[mt_key]
                                        print(f"\n      [MULTI_TAG] {mt_key}")
                                        print(f"        Keys: {list(mt.keys())}")

                                        # Look for features (MNI coordinates might be here)
                                        if 'features' in mt:
                                            features = mt['features']
                                            print(f"        [FEATURES] Keys: {list(features.keys())[:10]}")

                                            # Try to find MNI coordinates
                                            for feat_key in features.keys():
                                                if 'mni' in feat_key.lower() or 'coord' in feat_key.lower():
                                                    feat = features[feat_key]
                                                    print(f"\n        [FEATURE] {feat_key}")
                                                    if 'data' in feat:
                                                        data = feat['data']
                                                        if isinstance(data, h5py.Dataset):
                                                            print(f"          Shape: {data.shape}, Dtype: {data.dtype}")
                                                            if data.size < 100:
                                                                print(f"          Values: {data[()]}")

                                # Explore sources (electrode labels might be here)
                                if 'sources' in elec_group:
                                    print(f"\n    [SOURCES] Exploring...")
                                    sources = elec_group['sources']
                                    print(f"      Keys: {list(sources.keys())[:20]}")

                                    # Try to access first few sources
                                    for src_key in list(sources.keys())[:5]:
                                        src = sources[src_key]
                                        print(f"\n      [SOURCE] {src_key}")
                                        if isinstance(src, h5py.Group):
                                            print(f"        Keys: {list(src.keys())}")
                                            # Look for name or label
                                            for attr_key in ['name', 'label', 'type']:
                                                if attr_key in src:
                                                    val = src[attr_key]
                                                    if isinstance(val, h5py.Dataset):
                                                        try:
                                                            print(f"        {attr_key}: {val[()].decode() if isinstance(val[()], bytes) else val[()]}")
                                                        except:
                                                            print(f"        {attr_key}: {val[()]}")

def main():
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Default to Subject 1 Session 1
        file_path = "datasets/human_mtl_units_wm/data_nix/Data_Subject_01_Session_01.h5"

    try:
        explore_hdf5_structure(file_path, max_depth=6)
        print("\n[SUCCESS] Exploration complete!")
        print("\nNext steps:")
        print("1. Identify exact HDF5 path to MNI coordinates")
        print("2. Identify exact HDF5 path to electrode labels")
        print("3. Test reading a few coordinate values")

    except Exception as e:
        print(f"\n[ERROR] Exploration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
