import React, { RefObject, useEffect, useRef, useState } from "react";
import "./App.css";

const App: React.FC = () => {
  const [timer, setTimer] = useState<number>(1);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [currWord, setCurrWord] = useState<string>("");
  const [typedWord, setTypedWord] = useState<string>("");
  const [wordList, setWordList] = useState<string[]>([]);
  const [typedHistory, setTypedHistory] = useState<string[]>([]);
  const [activeWordRef, setActiveWordRef] =
    useState<RefObject<HTMLDivElement> | null>(null);
  const [caretRefState, setCaretRef] =
    useState<RefObject<HTMLSpanElement> | null>(null);

  const extraLetters = typedWord.slice(currWord.length).split("");
  const activeWord = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const [result, setResult] = useState<boolean[]>([]);
  const [wpm, setWpm] = useState<number>(0);

  useEffect(() => {
    document.onkeydown = (e) => {
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Tab") {
        recordTest(e.key, e.ctrlKey);
        e.preventDefault();
      }
    };
    return () => {
      document.onkeydown = null;
    };
  }, []);

  useEffect(() => {
    let idx = typedWord.length - 1;
    const currWordEl = activeWordRef?.current!;
    if (currWordEl) {
      currWordEl.children[idx + 1].classList.add(
        currWord[idx] !== typedWord[idx] ? "wrong" : "right"
      );
    }
  }, [currWord, typedWord, activeWordRef]);

  useEffect(() => {
    let idx = typedWord.length;
    const currWordEl = activeWordRef?.current!;
    if (currWordEl && idx < currWord.length)
      currWordEl.children[idx + 1].classList.remove("wrong", "right");
  }, [currWord.length, typedWord, activeWordRef]);

  useEffect(() => {
    if (!timer && timerId) {
      resultCleck();
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [timer, timerId]);

  const resultCleck = () => {
    const spaces = wordList.indexOf(currWord);
    let correctChars = 0;
    const result = typedHistory.map(
      (typedWord, idx) => typedWord === wordList[idx]
    );
    result.forEach((r, idx) => {
      if (r) correctChars += wordList[idx].length;
    });
    const wpm = ((correctChars + spaces) * 60) / 60 / 5;

    setResult(result);
    setWpm(wpm);

    return;
  };

  const handleBackspace = (ctrlKey: boolean) => {
    const currIdx = typedHistory.length - 1;
    const currWordEl = activeWordRef?.current!;
    if (!typedWord && typedHistory[currIdx] !== wordList[currIdx]) {
      backtrackWord(ctrlKey);
      currWordEl.previousElementSibling!.classList.remove("right", "wrong");
      if (ctrlKey) {
        currWordEl.previousElementSibling!.childNodes.forEach(
          (char: ChildNode) => {
            const changeChar = char as HTMLSpanElement;
            changeChar.classList.remove("wrong", "right");
            return;
          }
        );
      }
    } else {
      if (ctrlKey) {
        setTypedWord("");
        currWordEl.childNodes.forEach((char: ChildNode) => {
          const changeChar = char as HTMLSpanElement;
          changeChar.classList.remove("wrong", "right");
        });
      } else {
        const newTypedWord = typedWord.slice(0, typedWord.length - 1);
        setTypedWord(newTypedWord);
      }
    }
  };

  const recordTest = (key: string, ctrlKey: boolean) => {
    if (!timer) {
      if (key === "Tab") {
        resetTest();
      }
      return;
    }
    if (!timerId && key !== "Tab") startTimer();
    const currWordEl = activeWordRef?.current!;
    currWordEl.scrollIntoView({ behavior: "smooth", block: "center" });
    const caret = caretRef?.current!;
    caret.classList.remove("blink");
    setTimeout(() => caret.classList.add("blink"), 500);
    switch (key) {
      case "Tab":
        if (timer !== 60 || timerId) {
          resetTest();
          document.getElementsByClassName("word")[0].scrollIntoView();
        }
        break;
      case " ":
        if (typedWord === "") return;
        currWordEl.classList.add(typedWord !== currWord ? "wrong" : "right");
        appendTypedHistory();
        break;
      case "Backspace":
        handleBackspace(ctrlKey);
        break;
      default:
        setChar(typedWord + key);
        break;
    }
  };

  const startTimer = () => {
    const timerId = setInterval(() => {
      setTimer(timer - 1);
    }, 1000);
    setTimerId(timerId);
  };

  const resetTest = async () => {
    document
      .querySelectorAll(".wrong, .right")
      .forEach((el) => el.classList.remove("wrong", "right"));
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    setWordList([]);
  };

  return timer ? (
    <div className="test">
      <div className="timer">{timer}</div>
      <div className="box">
        {wordList.map((word, idx) => {
          const isActive = currWord === word && typedHistory.length === idx;
          return (
            <div
              key={word + idx}
              className="word"
              ref={isActive ? activeWord : null}
            >
              {isActive ? (
                <span
                  ref={caretRef}
                  id="caret"
                  className="blink"
                  style={{
                    left: typedWord.length * 14.5833,
                  }}
                >
                  |
                </span>
              ) : null}
              {word.split("").map((char, charId) => {
                return <span key={char + charId}>{char}</span>;
              })}
              {isActive
                ? extraLetters.map((char, charId) => {
                    return (
                      <span key={char + charId} className="wrong extra">
                        {char}
                      </span>
                    );
                  })
                : typedHistory[idx]
                ? typedHistory[idx]
                    .slice(wordList[idx].length)
                    .split("")
                    .map((char, charId) => {
                      return (
                        <span key={char + charId} className="wrong extra">
                          {char}
                        </span>
                      );
                    })
                : null}
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="result">
      <table>
        <tbody>
          <tr>
            <td colSpan={2} align="center">
              <h1>{Math.round(wpm) + " wpm"}</h1>
            </td>
          </tr>
          <tr>
            <th>Correct Words:</th>
            <td>{result.filter((x) => x).length}</td>
          </tr>
          <tr className="wrong">
            <th>Incorrect Words:</th>
            <td>{result.filter((x) => !x).length}</td>
          </tr>
          <tr>
            <td colSpan={2} align="center">
              <button onClick={() => resetTest()}>Restart</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default App;
