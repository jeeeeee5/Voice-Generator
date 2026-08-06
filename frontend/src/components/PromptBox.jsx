export default function PromptBox({ text, setText }) {
  return (
    <div className="relative mb-4">
      <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-xl pointer-events-none" />
      <div className="relative w-full h-72 md:h-[246px] bg-[#29292E] border-2 border-white rounded-xl p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to synthesize into voice..."
          className="w-full h-full text-gray-200 text-lg bg-transparent focus:ring-0 placeholder:text-gray-500 resize-none outline-none"
        />
      </div>
    </div>
  );
}
