export function Footer() {
  return (
    <footer className="bg-black/20 backdrop-blur-[4px] border-t border-[#343536] py-3">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-[#818384]">
        <div>© 2025 SpotLight</div>
        <div className="flex space-x-4">
          <a href="/about" className="hover:text-white transition-colors duration-300">About</a>
          <a href="/terms" className="hover:text-white transition-colors duration-300">Terms</a>
          <a href="/privacy" className="hover:text-white transition-colors duration-300">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
