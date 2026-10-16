"""Compile authored HSK material into deterministic static application data."""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path("work/vendor").resolve()))
from pypinyin import Style, lazy_pinyin, load_phrases_dict


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_teaching():
    teaching = {}
    for path in sorted(Path("content").glob("level-*.tsv")):
        for number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
            if not line.strip():
                continue
            parts = line.split("\t")
            require(len(parts) == 4 and all(parts), f"Invalid teaching row: {path}:{number}")
            key, *fields = parts
            require(key not in teaching, f"Duplicate teaching row: {key}")
            teaching[key] = fields
    return teaching


def make_pinyin(zh):
    syllables = lazy_pinyin(zh, style=Style.TONE, tone_sandhi=False, neutral_tone_with_five=False)
    require(len(syllables) == len(zh), f'Unaligned pinyin: {zh}')
    for pos, char in enumerate(zh):
        if char == '觉':
            syllables[pos] = 'jiào' if pos > 0 and zh[pos - 1] in '睡好' else syllables[pos]
        if char == '削' and zh[pos:pos + 2] == '削了':
            syllables[pos] = 'xiāo'
        if char == '倒' and zh[pos:pos + 2] == '倒是':
            syllables[pos] = 'dào'
        if char == '为' and pos > 0 and (zh[pos - 1] in '尤作成认以'):
            syllables[pos] = 'wéi'
        if char == '教' and zh[pos:pos + 3] == '教我们':
            syllables[pos] = 'jiāo'
        if char == '一':
            syllables[pos] = 'yī'
        if char == '不':
            syllables[pos] = 'bù'
        if char == '得':
            syllables[pos] = 'de'
            if pos > 0 and zh[pos - 1] in '难值获取赢' or zh[max(0, pos - 1):pos + 2] in ['不得', '不得了']:
                syllables[pos] = 'dé'
            if zh[pos:pos + 2] in ['得走', '得去'] or (pos > 0 and zh[pos - 1] == '非'):
                syllables[pos] = 'děi'
            if zh[pos:pos + 2] == '得了' and pos == 0:
                syllables[pos] = 'dé'
        if char == '地':
            syllables[pos] = 'dì' if zh[pos:pos + 2] in ['地铁', '地图', '地方', '地区', '地步', '地址', '地震', '地球'] or (pos > 0 and zh[pos - 1] == '特') else 'de'
        if char == '长':
            syllables[pos] = 'zhǎng' if pos > 0 and zh[pos - 1] in '班生' else 'cháng'
        if char == '着' and (zh[pos:pos + 2] == '着急' or zh[max(0, pos - 2):pos + 1] == '用不着'):
            syllables[pos] = 'zháo'
        if char == '了' and zh[max(0, pos - 2):pos + 1] in ['不得了', '吃不了']:
            syllables[pos] = 'liǎo'
        if char == '了' and zh[max(0, pos - 1):pos + 3] == '作了解释':
            syllables[pos] = 'le'
        if char == '儿' and pos > 0 and zh[pos - 1] in '哪那这点会块头劲':
            syllables[pos - 1] += 'r'
            syllables[pos] = ''
    py = ' '.join(syllable for syllable in syllables if syllable)
    py = re.sub('\\s+([，。？！、；：])', '\\1', py)
    return py


def make_lesson(row, teaching, course, order):
    explain, zh, ja = teaching[row["id"]]
    page = str(row["pdfPage"])
    if "-extra" in row["id"]:
        chapter = course["extraChapters"][page]
    else:
        number = int(row["id"].split("-")[-1])
        chapter = next(label for start, label in reversed(course["sections"][page]) if start <= number)
    pattern = re.sub(r"^（\d+）", "", row["source"])
    title = pattern if len(pattern) < 34 else (row["category"] or chapter)
    if not title or title.isdigit():
        title = chapter
    lesson = {
        "id": row["id"], "level": row["level"], "order": order,
        "chapter": chapter, "name": title, "title": title,
        "rule": explain.split("。")[0] + "。", "explain": explain,
        "sourceLabel": row["source"], "sourcePage": row["page"], "pdfPage": row["pdfPage"],
        "zh": zh, "py": make_pinyin(zh), "ja": ja,
    }
    if row.get("sourceCorrection"):
        lesson["sourceNote"] = row["sourceCorrection"]
    return lesson


def add_teaching_notes(lessons):
    notes = {}
    for path in sorted(Path("content").glob("notes-*.tsv")):
        for number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
            fields = line.split("\t")
            require(len(fields) == 7 and all(fields), f"Invalid note: {path}:{number}")
            key, *values = fields
            require(key not in notes, f"Duplicate note: {key}")
            notes[key] = values
    require(set(notes) == {lesson["id"] for lesson in lessons}, "Every lesson needs authored usage and quiz")
    for index, lesson in enumerate(lessons):
        usage, question, correct, wrong1, wrong2, feedback = notes[lesson["id"]]
        options = [wrong1, wrong2]
        answer = index % 3
        options.insert(answer, correct)
        require(len(set(options)) == 3, f"Duplicate quiz choices: {lesson['id']}")
        lesson.update(usage=usage, question=question, options=options,
                      answer=answer, feedback=feedback)


def main():
    source = read_json("content/syllabus.json")
    course = read_json("content/course.json")
    teaching = read_teaching()
    require(len({row["id"] for row in source}) == len(source), "Duplicate syllabus IDs")
    require(set(teaching) == {row["id"] for row in source}, "Syllabus and teaching mismatch")
    load_phrases_dict(read_json("content/pronunciation.json"))
    lessons, counts = [], {}
    for row in source:
        level = row["level"]
        counts[level] = counts.get(level, 0) + 1
        lessons.append(make_lesson(row, teaching, course, counts[level]))
    add_teaching_notes(lessons)
    metadata = course["metadata"]
    manifest = {
        "edition": metadata["edition"], "sourceUrl": metadata["sourceUrl"], "pdfUrl": metadata["syllabusPdf"],
        "printedPages": [min(row["page"] for row in source), max(row["page"] for row in source)],
        "sourceRows": len(source), "lessons": len(lessons), "levels": counts,
        "coverageUnit": metadata["coverageUnit"], "missing": [],
    }
    write_json("src/data/curriculum.json", lessons)
    write_json("src/data/metadata.json", metadata)
    questions = read_json("content/questions.json")
    for question in questions:
        question["py"] = make_pinyin(question["zh"])
        question["examplePy"] = make_pinyin(question["example"].split("→")[0].strip())
    write_json("src/data/questions.json", questions)
    write_json("content/coverage.json", manifest)
    print(json.dumps({"lessons": len(lessons), "levels": counts, "missing": []}, ensure_ascii=False))


if __name__ == "__main__":
    main()
