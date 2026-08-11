import { forwardRef } from "react";

const PromptBox = forwardRef(function PromptBox({ text, setText, language = "en" }, ref) {
  const placeholder = language === "zh"
    ? "输入要合成语音的文字...\n可以使用标签如 (紧张)、(叹气)，或停顿符号如 ... 和 [Pause]"
    : "Enter text to synthesize into voice...\nTry tags like (Nervous), (Sigh), or pauses like ... and [Pause]";

  return (
    <div className="relative mb-4">
      <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-xl pointer-events-none" />
      <div className="relative w-full h-72 md:h-[246px] bg-[#29292E] border-2 border-white rounded-xl p-5">
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full text-gray-200 text-lg bg-transparent focus:ring-0 placeholder:text-gray-500 resize-none outline-none"
        />
      </div>
    </div>
  );
});

export default PromptBox;