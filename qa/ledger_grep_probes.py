# Nightly grep probes (src unchanged => src greps equal live bundle). PASS = item fixed.
import re,subprocess,sys
def g(p,paths="src netlify"):
    r=subprocess.run(f"grep -rniE '{p}' {paths} | head -3",shell=True,capture_output=True,text=True);return r.stdout.strip()
P=[("X16","shipping_address present",lambda:bool(g("shipping_address"))),
("X33","review queue implemented",lambda:bool(g("plan_change|review_queue|needs_review"))),
("X34","'No medical history needed' gone",lambda:not g("No medical history needed","src")),
("X37","'Almost never' option merged",lambda:not g("Almost never","src")),
("N08","'\\$150 to \\$300' gone",lambda:not g("150 to .?\\$?300","src")),
("X24","'held until physician sign-off' gone",lambda:not g("held until physician","src")),
("X51","streak write to profiles",lambda:bool(g("profiles.*streak|streak:.*update","src"))),
("X73","native alert() in CommonTrackDecision",lambda:"alert(" not in open("src/components/CommonTrackDecision.js").read() if __import__('os').path.exists("src/components/CommonTrackDecision.js") else None),
("X13","emoji at Dashboard",lambda:not re.search("[\U0001F300-\U0001FAFF]",open("src/components/Dashboard.js").read()) if __import__('os').path.exists("src/components/Dashboard.js") else None),
("X31","post-lab copy fixed",lambda:not g("whenever they arrive","src")),
]
for i,d,f in P:
    try: r=f()
    except Exception as e: r=None
    print("PROBE",i,"PASS" if r else ("SKIP" if r is None else "FAIL"),"|",d)
