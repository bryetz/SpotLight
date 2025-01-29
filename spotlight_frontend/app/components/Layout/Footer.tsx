export default function Footer() {
  return (
    <footer className="bg-[#1a1a1b] border-t border-[#343536] mt-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[#818384] text-sm">
          <div className="space-y-2">
            <h3 className="text-white font-medium">About</h3>
            <p>Careers</p>
            <p>Press</p>
            <p>Blog</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-medium">Legal</h3>
            <p>Privacy Policy</p>
            <p>Terms of Service</p>
            <p>Content Policy</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-medium">Support</h3>
            <p>Help Center</p>
            <p>Safety Tips</p>
            <p>Contact Us</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-medium">Social</h3>
            <p>Twitter</p>
            <p>Instagram</p>
            <p>Facebook</p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#343536] text-center text-[#818384] text-sm">
          <p>© {new Date().getFullYear()} SpotLight. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}