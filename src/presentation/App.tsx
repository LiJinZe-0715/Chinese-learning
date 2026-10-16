import { LessonStudy } from './LessonStudy';
import { LessonQuiz } from './LessonQuiz';
import { useLearning } from './use-learning';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  GraduationCap,
  Search,
  X,
} from 'lucide-react';
import { Button } from './controls';
import {
  levels,
  levelLessons,
  firstLessonIndex,
  syllabusPdf,
  glossary,
} from '../bootstrap';
import { levelLabel } from '../domain/curriculum';
import { PAGE_SIZE } from './pagination';
import { Dictionary } from './Dictionary';
import { useState } from 'react';
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    index,
    tab,
    setTab,
    choice,
    setChoice,
    checked,
    retry,
    continueLearning,
    review,
    previous,
    next,
    nextLabel,
    courseCompleted,
    done,
    listPage,
    setListPage,
    heading,
    lesson,
    level,
    total,
    course,
    correct,
    pages,
    visible,
    openLesson,
    check,
  } = useLearning();
  return (
    <>
      <header>
        <a className="brand" href={import.meta.env.BASE_URL}>
          <b>文</b> ことば
          <small>言葉をつなぐ、世界が広がる。</small>
        </a>
        <span>日本語で学ぶ、中国語の文法。</span>
        <small className="header-badge">HSK 1–9 · {total}課</small>
        <button
          className="mobile-menu"
          aria-expanded={menuOpen}
          aria-controls="learning-path"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <BookOpen size={18} />}
          <span>{menuOpen ? '閉じる' : '目次'}</span>
        </button>
      </header>
      <div className="workspace">
        <aside id="learning-path" className={menuOpen ? 'is-open' : ''}>
          <small className="kicker">LEARNING PATH</small>
          <h2>
            文法を学ぶ <BookOpen size={18} />
          </h2>
          <p>大綱の順番で、一歩ずつ。</p>
          <nav aria-label="難易度を選択">
            {levels.map((name, i) => (
              <button
                aria-current={level === i + 1 ? 'step' : undefined}
                className={level === i + 1 ? 'selected' : ''}
                key={name}
                onClick={() => openLesson(firstLessonIndex(i + 1))}
              >
                <i>{levelLabel(i + 1)}</i>
                <span>
                  <strong>HSK {levelLabel(i + 1)}</strong>
                  <small>
                    {name} · {levelLessons(i + 1).length}課
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </nav>
          <div className="course-list">
            <div className="course-caption">
              <small className="kicker">
                HSK {levelLabel(level)} · {course.length} LESSONS
              </small>
              <span>{courseCompleted} 完了</span>
            </div>
            <select
              className="lesson-select"
              aria-label="この級のレッスンへ移動"
              value={index}
              onChange={(e) => {
                openLesson(Number(e.target.value));
                setMenuOpen(false);
              }}
            >
              {course.map((l) => (
                <option key={l.id} value={l.index}>
                  {l.order}. {l.name}
                </option>
              ))}
            </select>
            <div className="course-items">
              {visible.map((l) => (
                <button
                  key={l.id}
                  className={l.id === lesson.id ? 'current' : ''}
                  aria-current={l.id === lesson.id ? 'page' : undefined}
                  onClick={() => openLesson(l.index)}
                >
                  <span>
                    {l.completed ? (
                      <Check size={14} />
                    ) : (
                      String(l.order).padStart(2, '0')
                    )}
                  </span>
                  <span className="course-name">{l.name}</span>
                </button>
              ))}
            </div>
            <div className="course-pager">
              <button
                disabled={listPage === 0}
                onClick={() => setListPage((p) => p - 1)}
                aria-label="前の12課"
              >
                <ArrowLeft size={14} />
              </button>
              <span>
                {listPage * PAGE_SIZE + 1}–
                {Math.min((listPage + 1) * PAGE_SIZE, course.length)} /{' '}
                {course.length}
              </span>
              <button
                disabled={listPage === pages - 1}
                onClick={() => setListPage((p) => p + 1)}
                aria-label="次の12課"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="side-note">
            <GraduationCap />
            <strong>語から、文へ。文から、文章へ。</strong>
            <p>
              語素・品詞から語段まで。
              <br />
              大綱の表を{total}の学習単位に分けています。
            </p>
          </div>
        </aside>
        <main>
          <div className="android-download" data-android-download>
            <div><strong>ことばの Android アプリ</strong><p>オフラインで学習できます。Android 8.0 以上。</p></div>
            <a href={`${import.meta.env.BASE_URL}downloads/Chinese-learning.apk`} download="Chinese-learning.apk">APK をダウンロード</a>
          </div>
          <div className="welcome">
            <div>
              <small className="kicker">A LITTLE EVERY DAY</small>
              <h2>今日も、ひとつずつ。</h2>
              <p>語順を知り、似た表現を比べて、自分の文を作る。</p>
            </div>
            <span className="welcome-mark" aria-hidden="true">
              あ<span>文</span>
            </span>
          </div>
          <button
            className="mobile-search-toggle"
            aria-expanded={searchOpen}
            aria-controls="dictionary-panel"
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Search size={18} />
            <span>中国語・日本語で文法を探す</span>
            {searchOpen ? <X size={17} /> : <ChevronRight size={17} />}
          </button>
          <div
            id="dictionary-panel"
            className={`dictionary-panel ${searchOpen ? 'is-open' : ''}`}
          >
            <Dictionary
              total={total}
              openLesson={(lessonIndex, focus) => {
                openLesson(lessonIndex, focus);
                setSearchOpen(false);
              }}
            />
          </div>
          <div className="breadcrumb">
            文法を学ぶ　 ›　 HSK {levelLabel(level)}　 ›　 {lesson.chapter}
          </div>
          <div className="heading">
            <div>
              <small className="eyebrow">
                {levels[level - 1]}　 <b>HSK {levelLabel(level)}</b>
              </small>
              <h1 ref={heading} tabIndex={-1}>
                {lesson.title}
              </h1>
              <p>
                {lesson.chapter} · 第{lesson.order}課
              </p>
            </div>
            <div className="number">
              {String(lesson.order).padStart(2, '0')}
              <small>/ {course.length} LESSONS</small>
            </div>
          </div>
          <div className="course-track">
            <span
              style={{ width: `${(lesson.order / course.length) * 100}%` }}
            />
          </div>
          <div className="tabs" aria-label="レッスンのステップ">
            <button
              aria-pressed={tab === 'learn'}
              className={tab === 'learn' ? 'active' : ''}
              onClick={() => setTab('learn')}
            >
              01　文法を理解する
            </button>
            <button
              aria-pressed={tab === 'quiz'}
              className={tab === 'quiz' ? 'active' : ''}
              onClick={() => setTab('quiz')}
            >
              02　練習してみる
            </button>
            <span className="progress-label">
              この回の学習　{done.length} / {total}
            </span>
          </div>
          {tab === 'learn' ? (
            <LessonStudy
              lesson={lesson}
              words={glossary[lesson.id] ?? []}
              syllabusPdf={syllabusPdf}
              onPractice={() => setTab('quiz')}
            />
          ) : tab === 'quiz' ? (
            <LessonQuiz
              lesson={lesson}
              choice={choice}
              checked={checked}
              correct={correct}
              nextLabel={nextLabel}
              setChoice={setChoice}
              check={check}
              retry={retry}
              continueLearning={continueLearning}
              onLearn={() => setTab('learn')}
            />
          ) : (
            <section className="summary" aria-label="学習の振り返り">
              <Check />
              <h2>おつかれさまでした。</h2>
              <p>
                この回で {done.length} / {total}{' '}
                課の練習に正解しました。未学習の文法や、気になる表現を復習しましょう。
              </p>
              <Button className="primary" onClick={review}>
                文法を復習する <ArrowRight />
              </Button>
            </section>
          )}
          <div className="lesson-bottom">
            <button disabled={index === 0} onClick={previous}>
              <ArrowLeft size={15} /> 前のレッスン
            </button>
            <span>
              LESSON {String(index + 1).padStart(3, '0')} / {total}
            </span>
            <button disabled={index === total - 1} onClick={next}>
              次のレッスン <ArrowRight size={15} />
            </button>
          </div>
          <details className="coverage">
            <summary>収録範囲と大綱について</summary>
            <p>
              2025年11月公表のHSK大綱「語法」p.383–403を、級と表内の順番で収録しています。語法内容のある586行と、内容欄が空欄の文法見出し7項目を、計
              {total}課に分けました。課数は本サイト独自の数え方です。
            </p>
            <ul>
              {levels.map((_, i) => (
                <li key={i}>
                  <button
                    onClick={() => openLesson(firstLessonIndex(i + 1), true)}
                  >
                    HSK {levelLabel(i + 1)}{' '}
                    <span>{levelLessons(i + 1).length}課</span>
                  </button>
                </li>
              ))}
            </ul>
            <p>
              七〜九級は大綱どおり一つの区分です。例文・日本語解説・練習は独自に作成しています。語彙・漢字・タスクの別大綱はこの文法コースの対象外です。
            </p>
          </details>
          <footer>
            <a
              href="https://www.chinesetest.cn/syllabus"
              target="_blank"
              rel="noreferrer"
            >
              参考：HSK公式大綱 ↗
            </a>
            　·　ピンインは基本の声調を表記しています。
            <br />
            進捗はこの画面を開いている間のみ保持されます。
          </footer>
        </main>
      </div>
    </>
  );
}
