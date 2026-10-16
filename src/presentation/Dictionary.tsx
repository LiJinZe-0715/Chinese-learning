import { useState } from 'react';
import { Button, Input } from './controls';
import { searchCurriculum, questions } from '../bootstrap';
import { levelLabel } from '../domain/curriculum';
import { PAGE_SIZE } from './pagination';
import { Search, Languages } from 'lucide-react';
export function Dictionary({
  total,
  openLesson,
}: {
  total: number;
  openLesson: (index: number, focus?: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const { search, matches, questionMatches } = searchCurriculum(query);
  return (
    <section className="dictionary" aria-label="中国語の表現と文法を検索">
      <label className="dictionary-label" htmlFor="dictionary-search">
        <Languages size={20} />
        <strong>表現と文法を探す</strong>
        <span>WORD EXPLORER</span>
      </label>
      <div className="dictionary-controls">
        <div className="search-input-wrap">
          <Search size={19} aria-hidden="true" />
          <Input
            id="dictionary-search"
            value={query}
            placeholder="例：谁、怎么、理由、比較"
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchPage(0);
            }}
          />
        </div>
        <Button
          variant="outline"
          aria-pressed={showQuestions}
          onClick={() => setShowQuestions((v) => !v)}
        >
          疑問表現を見る
        </Button>
        {query && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('');
              setSearchPage(0);
            }}
          >
            クリア
          </Button>
        )}
      </div>
      <p className="dictionary-hint">
        全{total}課の語句・例文・使い分けを検索できます。中国語でも日本語でも入力してください。
      </p>
      {(showQuestions || (search && questionMatches.length > 0)) && (
        <details
          open
          className="question-reference"
          key={showQuestions ? 'questions-open' : search}
        >
          <summary>中国語の疑問表現 · 語順と使い分け</summary>
          <div className="dictionary-table-wrap">
            <table className="dictionary-table">
              <thead>
                <tr>
                  <th>中国語・ピンイン</th>
                  <th>日本語の意味</th>
                  <th>例文と使い分け</th>
                </tr>
              </thead>
              <tbody>
                {(showQuestions ? questions : questionMatches).map((q) => (
                  <tr key={q.zh}>
                    <td lang="zh-CN" data-label="中国語・ピンイン">
                      <strong>{q.zh}</strong>
                      <small lang="zh-Latn">{q.py}</small>
                    </td>
                    <td lang="ja" data-label="日本語の意味">
                      <strong>{q.ja}</strong>
                    </td>
                    <td data-label="例文と使い分け">
                      <p>{q.example}</p>
                      <small lang="zh-Latn">{q.examplePy}</small>
                      <small>{q.note}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {search && (
        <div className="search-results">
          <output>
            {matches.length}課が見つかりました
            {questionMatches.length
              ? ` · 疑問表現 ${questionMatches.length}件`
              : ''}
          </output>
          {!matches.length && !questionMatches.length && (
            <p>該当する表現がありません。「怎么」「比較」など短い語で検索してください。</p>
          )}
          {matches
            .slice(searchPage * PAGE_SIZE, (searchPage + 1) * PAGE_SIZE)
            .map(({ lesson: l, index: i, words }) => (
              <div className="search-result" key={l.id}>
                <button onClick={() => openLesson(i, true)}>
                  <strong lang="zh-CN">{l.sourceLabel}</strong>
                  <span>
                    HSK {levelLabel(l.level)} · 第{l.order}課 · 解説を読む →
                  </span>
                </button>
                {words.length ? (
                  <dl>
                    {words.map((w, n) => (
                      <div key={n}>
                        <dt lang="zh-CN">{w.zh}</dt>
                        <dd lang="ja">{w.ja}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <>
                    <p>{l.rule}</p>
                    <p lang="ja">
                      {l.zh} → {l.ja}
                    </p>
                  </>
                )}
              </div>
            ))}
          {matches.length > PAGE_SIZE && (
            <div className="search-pager">
              <Button
                variant="outline"
                disabled={searchPage === 0}
                onClick={() => setSearchPage((p) => p - 1)}
              >
                前のページ
              </Button>
              <span>
                {searchPage + 1} / {Math.ceil(matches.length / PAGE_SIZE)}
              </span>
              <Button
                variant="outline"
                disabled={(searchPage + 1) * PAGE_SIZE >= matches.length}
                onClick={() => setSearchPage((p) => p + 1)}
              >
                次のページ
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
