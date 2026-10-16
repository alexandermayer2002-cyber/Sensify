from robot import Robot
import json
r = Robot("R2M")
report = {"screens": {}, "shots": []}
try:
    r.goto(); r.sleep(3.0)
    t = r.snap("full", 9000)
    for probe in ["Sarah", "VERIFIED RESULT", "EXAMPLE · A FINISHED PROGRAM", "Day 1", "Day 42", "Chicken", "Corn", "WHAT 184 DAYS"]:
        print(f"{probe!r}: {'PRESENT' if probe in t else 'absent'}")
    r.shot("r2_mkt_wall")
finally:
    r.close()
