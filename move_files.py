import os
import shutil

src = 'pepe-arcade'
dst = '.'

files = os.listdir(src)
for f in files:
    s_path = os.path.join(src, f)
    d_path = os.path.join(dst, f)
    if os.path.isdir(s_path):
        if os.path.exists(d_path):
            # Merge directories
            for root, dirs, files_in_dir in os.walk(s_path):
                rel_path = os.path.relpath(root, src)
                dest_root = os.path.join(dst, rel_path)
                if not os.path.exists(dest_root):
                    os.makedirs(dest_root)
                for file in files_in_dir:
                    shutil.move(os.path.join(root, file), os.path.join(dest_root, file))
        else:
            shutil.move(s_path, d_path)
    else:
        if os.path.exists(d_path):
            os.remove(d_path)
        shutil.move(s_path, d_path)

# Remove the empty (or now hopefully empty) folder
try:
    shutil.rmtree(src)
except:
    pass
