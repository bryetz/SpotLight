import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1b] border-b border-[#343536]">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-white">SpotLight</h1>

        {/* Navigation */}
        <nav className="flex-1 flex items-center gap-4 ml-4">
          <button className="px-3 py-1 text-sm text-gray-300 hover:bg-[#272729] rounded-full">
            Popular
          </button>
          <button className="px-3 py-1 text-sm text-gray-300 hover:bg-[#272729] rounded-full">
            Latest
          </button>
          <button className="px-3 py-1 text-sm text-gray-300 hover:bg-[#272729] rounded-full">
            Nearby
          </button>
        </nav>

        {/* Search */}
        <div className="relative flex-1 max-w-xl">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-[#818384]" />
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full pl-10 pr-4 py-2 bg-[#272729] border border-[#343536] text-gray-300 rounded-full placeholder-[#818384] focus:outline-none focus:border-[#d7dadc]"
          />
        </div>

        {/* Auth */}
        <button className="ml-4 px-4 py-2 text-sm font-medium text-white bg-[#272729] hover:bg-[#372729] rounded-full">
          Sign In
        </button>
      </div>
    </header>
  );
}