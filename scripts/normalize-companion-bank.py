import json

path = "quality/sitguru-ai-companions-400-question-bank.json"
data = json.load(open(path, encoding="utf-8"))


def fix(s: str) -> str:
    return (
        s.replace("\ufb01", "fi")
        .replace("\ufb02", "fl")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("pack@sitguru.com", "support@sitguru.com")
    )


for q in data["questions"]:
    for key in ("question", "expected", "category"):
        if isinstance(q.get(key), str):
            q[key] = fix(q[key])

json.dump(data, open(path, "w", encoding="utf-8"), indent=2)
print("normalized", data["count"], "questions")
