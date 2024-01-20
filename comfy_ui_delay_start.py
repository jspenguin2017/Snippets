import os
import time

class DelayStart:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "latent": ("LATENT",),
            },
        }

    RETURN_TYPES = ("LATENT",)
    FUNCTION = "main"
    CATEGORY = "Sleep"

    def main(self, latent):
        lockfile = f"{os.environ['HOME']}/ComfyUIStartLock";
        while os.path.isfile(lockfile):
            print(f"Remove {lockfile} to start")
            time.sleep(5)
        return (latent,)

NODE_CLASS_MAPPINGS = {
    "DelayStart": DelayStart
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DelayStart": "Delay Start"
}
