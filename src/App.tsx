import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type BoxStatus = "available" | "locked" | "reserved";
type MysteryBox = { id: string; status: BoxStatus; timer: number };

const PRICE_USD = 3;
const RESERVE_TIME_SEC = 5;

function runSelfTests(ids: string[]) {
  const failures: string[] = [];
  if (ids.length !== 26) failures.push("Expected 26 boxes A-Z");
  if (ids[0] !== "A" || ids[25] !== "Z") failures.push("Expected A..Z");
  if (new Set(ids).size !== 26) failures.push("Expected unique ids");
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] !== String.fromCharCode(65 + i)) {
      failures.push("Expected sequential A..Z");
      break;
    }
  }
  if (failures.length) console.error("Self-tests failed:", failures);
}

function ReceiptDownloadButton({
  disabled,
  receiptText,
}: {
  disabled: boolean;
  receiptText: string;
}) {
  const download = () => {
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button className={`btn ${disabled ? "btnDisabled" : "btnDark"}`} disabled={disabled} onClick={download}>
      Download Receipt (TXT)
    </button>
  );
}

function PaymentButton({
  disabled,
  onPay,
}: {
  disabled: boolean;
  onPay: () => void;
}) {
  const [appleSrc, setAppleSrc] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg"
  );
  const [googleSrc, setGoogleSrc] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/256px-Google_Pay_Logo.svg.png"
  );

  return (
    <button className={`payBtn ${disabled ? "payDisabled" : ""}`} disabled={disabled} onClick={onPay}>
      <div className="payItem">
        <img
          src={appleSrc}
          alt="Apple Pay"
          className="payLogo"
          onError={() =>
            setAppleSrc(
              "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/256px-Apple_Pay_logo.svg.png"
            )
          }
        />
        <span className="payText">Apple Pay</span>
      </div>

      <div className="divider" />

      <div className="payItem">
        <img
          src={googleSrc}
          alt="Google Pay"
          className="payLogo"
          onError={() =>
            setGoogleSrc(
              "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Google_Pay_Logo.svg/256px-Google_Pay_Logo.svg.png"
            )
          }
        />
        <span className="payText">Google Pay</span>
      </div>
    </button>
  );
}

export default function App() {
  const ids = useMemo(() => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), []);
  const [boxes, setBoxes] = useState<MysteryBox[]>(() => ids.map((id) => ({ id, status: "available", timer: 0 })));
  const [selected, setSelected] = useState<string[]>([]);
  const [lastReceipt, setLastReceipt] = useState("");

  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => runSelfTests(ids), [ids]);

  useEffect(() => {
    try {
      clickSoundRef.current = new Audio("https://www.soundjay.com/buttons/sounds/button-16.mp3");
      successSoundRef.current = new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3");
      if (clickSoundRef.current) clickSoundRef.current.volume = 0.6;
      if (successSoundRef.current) successSoundRef.current.volume = 0.7;
    } catch {}
  }, []);

  const play = async (a: HTMLAudioElement | null) => {
    if (!a) return;
    try {
      a.currentTime = 0;
      await a.play();
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes((prev) =>
        prev.map((b) => {
          if (b.status !== "locked") return b;
          if (b.timer > 1) return { ...b, timer: b.timer - 1 };
          return { ...b, status: "available", timer: 0 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => {
        const b = boxes.find((x) => x.id === id);
        return b?.status === "locked";
      })
    );
  }, [boxes]);

  const total = selected.length * PRICE_USD;

  const handleSelect = async (box: MysteryBox) => {
    if (box.status !== "available") return;
    await play(clickSoundRef.current);

    setBoxes((prev) =>
      prev.map((b) => (b.id === box.id ? { ...b, status: "locked", timer: RESERVE_TIME_SEC } : b))
    );
    setSelected((prev) => (prev.includes(box.id) ? prev : [...prev, box.id]));
  };

  const handlePayment = async () => {
    if (selected.length === 0) return;
    await play(successSoundRef.current);

    setBoxes((prev) => prev.map((b) => (selected.includes(b.id) ? { ...b, status: "reserved", timer: 0 } : b)));

    const now = new Date();
    const receiptLines = [
      "CHANCYBOXES Receipt",
      `Date: ${now.toLocaleString()}`,
      `Mystery Boxes: ${selected.join(", ")}`,
      `Price: $${PRICE_USD} each`,
      `Total: $${total}`,
      "Payment: Apple Pay / Google Pay (Mock)",
      "Status: Successful",
    ];
    setLastReceipt(receiptLines.join("\n"));
    setSelected([]);
  };

  const resetAll = () => {
    setBoxes(ids.map((id) => ({ id, status: "available", timer: 0 })));
    setSelected([]);
    setLastReceipt("");
  };

  return (
    <div className="page">
      <style>{`
        :root{
          --bg:#053321;
          --panel:#042a1b;
          --panel2:#041f15;
          --text:#ffffff;
          --muted:#b9e4cf;
          --line:#0d5b3a;
          --avail:#22c55e;
          --lock:#f59e0b;
          --res:#ef4444;
          --shadow: 0 16px 40px rgba(0,0,0,.45);
        }
        *{box-sizing:border-box}
        body{margin:0;font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; background:var(--bg); color:var(--text)}
        .page{min-height:100vh; padding:18px 16px 40px; display:flex; flex-direction:column; align-items:center; gap:18px}
        .headerWrap{width:100%; max-width:980px; display:flex; justify-content:center}
        .headerBox{background:var(--panel); border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:16px 18px; box-shadow:var(--shadow); text-align:center}
        .title{font-size:34px; font-weight:900; margin:0; text-shadow: 0 6px 0 rgba(0,0,0,.55), 0 0 14px rgba(0,0,0,.5)}
        .sub{margin-top:10px; font-size:13.5px; color:var(--muted); text-shadow: 0 3px 0 rgba(0,0,0,.55)}
        .grid{display:grid; grid-template-columns: repeat(7, 82px); gap:18px; margin-top:6px; justify-content:center}
        @media (max-width: 720px){
          .grid{grid-template-columns: repeat(5, 74px); gap:14px}
        }
        .boxBtn{width:82px; height:82px; border:none; border-radius:16px; cursor:pointer; box-shadow:0 10px 22px rgba(0,0,0,.35); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; position:relative}
        .boxBtn:disabled{cursor:not-allowed; opacity:.92}
        .boxId{font-weight:900; font-size:24px; text-shadow: 0 5px 0 rgba(0,0,0,.55), 0 0 12px rgba(0,0,0,.5)}
        .boxPrice{font-weight:900; font-size:16px; margin-top:4px; text-shadow: 0 5px 0 rgba(0,0,0,.55)}
        .timer{font-weight:900; font-size:12.5px; margin-top:5px; text-shadow: 0 4px 0 rgba(0,0,0,.55)}
        .avail{background:var(--avail)}
        .locked{background:var(--lock)}
        .reserved{background:var(--res)}
        .pulseRing::after{
          content:\"\"; position:absolute; inset:-6px; border-radius:20px;
          border:2px solid rgba(255,255,255,.9);
          animation:pulse 1.1s ease-in-out infinite;
        }
        @keyframes pulse{
          0%{transform:scale(.96); opacity:.55}
          60%{transform:scale(1.07); opacity:.18}
          100%{transform:scale(.96); opacity:.55}
        }

        .panel{width:100%; max-width:520px; background:var(--panel); border:1px solid rgba(255,255,255,.06); border-radius:18px; padding:18px; box-shadow:var(--shadow)}
        .panelHead{display:flex; align-items:center; justify-content:space-between; gap:12px}
        .panelTitle{font-size:20px; font-weight:900; margin:0; text-shadow: 0 5px 0 rgba(0,0,0,.55)}
        .each{color:var(--muted); font-weight:900}
        .panelText{margin:14px 0 12px; color:rgba(255,255,255,.95)}
        .btn{width:100%; padding:12px 14px; border-radius:14px; border:1px solid rgba(255,255,255,.08); font-weight:900}
        .btnDark{background:var(--panel2); color:white; cursor:pointer}
        .btnDark:hover{filter:brightness(1.08)}
        .btnDisabled{background:rgba(4,31,21,.5); color:rgba(255,255,255,.55)}
        .reset{margin-top:10px}

        .payBtn{
          width:100%; padding:12px 14px; border-radius:14px; border:1px solid rgba(0,0,0,.15);
          background:#b7f7d6; color:#062b1c; font-weight:900;
          display:flex; align-items:center; justify-content:center; gap:16px;
          cursor:pointer;
        }
        .payBtn:hover{filter:brightness(1.05)}
        .payDisabled{opacity:.5; cursor:not-allowed}
        .payItem{display:flex; align-items:center; gap:10px}
        .payLogo{height:18px; display:block}
        .payText{font-size:13px}
        .divider{width:1px; height:24px; background:rgba(6,43,28,.25)}
      `}</style>

      <div className="headerWrap">
        <div className="headerBox">
          <motion.h1 className="title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            Mystery Box Selection (A–Z)
          </motion.h1>
          <div className="sub">
            After selecting one or more boxes, complete the payment using the icon at the bottom of the page (Apple Pay / Google Pay).
          </div>
        </div>
      </div>

      <div className="grid">
        {boxes.map((box) => {
          const cls =
            box.status === "available" ? "boxBtn avail" : box.status === "locked" ? "boxBtn locked pulseRing" : "boxBtn reserved";
          const isLocked = box.status === "locked";
          return (
            <motion.button
              key={box.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(box)}
              disabled={box.status !== "available"}
              className={cls}
              animate={{
                scale: isLocked ? [1, 1.08, 1] : 1,
                boxShadow: isLocked ? "0 0 18px 6px rgba(255,255,255,.55)" : "0 10px 22px rgba(0,0,0,.35)",
              }}
              transition={{ duration: 0.7, repeat: isLocked ? Infinity : 0 }}
            >
              <div className="boxId">{box.id}</div>
              <div className="boxPrice">${PRICE_USD}</div>
              {isLocked && <div className="timer">⏱ {box.timer}s</div>}
            </motion.button>
          );
        })}
      </div>

      <div className="panel">
        <div className="panelHead">
          <h2 className="panelTitle">Selected Mystery Boxes</h2>
          <div className="each">$3 each</div>
        </div>

        {selected.length > 0 ? (
          <>
            <div className="panelText">
              Total: ${total} | Boxes: {selected.join(", ")}
            </div>
            <PaymentButton disabled={false} onPay={handlePayment} />
          </>
        ) : (
          <>
            <div className="panelText">Select one or more boxes to proceed.</div>
            <PaymentButton disabled={true} onPay={handlePayment} />
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <ReceiptDownloadButton disabled={!lastReceipt} receiptText={lastReceipt || ""} />
        </div>

        <button className="btn btnDark reset" onClick={resetAll}>
          Reset
        </button>
      </div>
    </div>
  );
}
