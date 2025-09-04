import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import echelonLogo from "@/assets/echelon-logo-new.png";

const Header = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img src={echelonLogo} alt="Echelon Texas" className="h-12 w-auto" />
          <span className="text-xl font-serif text-gold">Echelon Texas</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-gold transition-colors">
            Home
          </Link>
          <Link to="/membership" className="text-white hover:text-gold transition-colors">
            Membership
          </Link>
          <Link to="/portal" className="text-white hover:text-gold transition-colors">
            Member Portal
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button variant="outline" asChild className="border-gold text-gold hover:bg-gold hover:text-black">
                <Link to="/portal">Portal</Link>
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                className="border-gold/50 text-gold/70 hover:bg-gold/10 hover:text-gold"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild className="border-gold text-gold hover:bg-gold hover:text-black">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="bg-gold hover:bg-gold-light text-black">
                <Link to="/signup">Join Now</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;