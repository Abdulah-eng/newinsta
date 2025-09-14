import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import echelonLogo from "/logo.png";

const Header = () => {
  const { user, signOut, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handlePortalClick = () => {
    // Check if user is subscribed before navigating to portal
    if (subscribed) {
      navigate('/portal');
    } else {
      navigate('/membership');
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-sm border-b border-gold/20">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img src={echelonLogo} alt="Echelon TX" className="h-16 w-auto" />
          <span className="text-xl font-serif text-gold">Echelon TX</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-gold transition-colors">
            Home
          </Link>
          <Link to="/membership" className="text-white hover:text-gold transition-colors">
            Membership
          </Link>
          <button 
            onClick={handlePortalClick}
            disabled={subscriptionLoading}
            className="text-white hover:text-gold transition-colors disabled:opacity-50"
          >
            {subscriptionLoading ? "Checking..." : "Member Portal"}
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button 
                variant="outline" 
                onClick={handlePortalClick}
                disabled={subscriptionLoading}
                className="border-gold text-gold hover:bg-gold hover:text-black disabled:opacity-50"
              >
                {subscriptionLoading ? "Checking..." : "Portal"}
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