# Licensed under CC0-1.0

import os
import time

class DelayStart:
    def __init__(self):
        self.lockfile = f"{os.environ['HOME']}/ComfyUIStartLock"
        print(f"DelayStart: Put this node between Latent Image and KSampler, and create {self.lockfile} to delay start")

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "latent": ("LATENT",),
            },
        }

    RETURN_TYPES = ("LATENT",)
    FUNCTION = "execute"
    CATEGORY = "utils"

    def execute(self, latent):
        while os.path.isfile(self.lockfile):
            print(f"DelayStart: Remove {self.lockfile} to start")
            time.sleep(5)
        print(f"DelayStart: Lockfile {self.lockfile} does not exist, starting")
        return (latent,)

NODE_CLASS_MAPPINGS = {
    "DelayStart": DelayStart
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DelayStart": "Delay Start"
}
