import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const Hero = () => {
  const { user } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const targetPosition = useRef({ x: 0, y: 0 });
  const spotlightRef = useRef<HTMLDivElement>(null);
  
  // Preload the hero image
  useEffect(() => {
    const img = new Image();
    img.src = "/features_img/image.png"; // Use the smaller image as primary
    img.onload = () => {
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error("Failed to load hero image");
      setImageLoaded(true); // Still mark as loaded so we show the fallback
    };
  }, []);
  
  // Handle mouse movement
  const handleMouseMove = (e: React.MouseEvent) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    targetPosition.current = {
      x: clientX - left,
      y: clientY - top
    };
  };
  
  // Create smooth animation effect
  useEffect(() => {
    if (!isHovering) return;
    
    let animationFrameId: number;
    const smoothFactor = 0.15; // Lower = more lag
    
    const animateSpotlight = () => {
      // Calculate the distance between current and target position
      const dx = targetPosition.current.x - mousePosition.x;
      const dy = targetPosition.current.y - mousePosition.y;
      
      // Move current position a percentage of the way to the target
      setMousePosition({
        x: mousePosition.x + dx * smoothFactor,
        y: mousePosition.y + dy * smoothFactor
      });
      
      animationFrameId = requestAnimationFrame(animateSpotlight);
    };
    
    animationFrameId = requestAnimationFrame(animateSpotlight);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHovering, mousePosition]);

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Image with Fallback */}
      <div className="absolute inset-0 z-0">
        {/* Fallback solid background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
        
        {/* Main background image */}
        <div 
          className={`absolute inset-0 transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            backgroundImage: "url('/features_img/heroimg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Darker overlay to create more contrast with spotlight */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Enhanced brightness spotlight that follows cursor with lag */}
        {isHovering && (
          <div 
            ref={spotlightRef}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.45) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.05) 75%, rgba(255,255,255,0) 100%)',
              left: mousePosition.x - 100,
              top: mousePosition.y - 100,
              transform: 'translate(0, 0)',
              mixBlendMode: 'lighten',
              filter: 'brightness(1.5) contrast(1.3) blur(10px)',
              boxShadow: '0 0 50px 15px rgba(255,255,255,0.25)',
              opacity: 0.85,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg"
            variants={itemVariants}
          >
            Transform Your Waste Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Value
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md"
            variants={itemVariants}
          >
            Join the sustainable revolution. Trade your recyclables for rewards and contribute to a greener future.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            {!user ? (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20 px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/about">
                    Learn More
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/create-listing">
                    Create Listing
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20 px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  asChild
                >
                  <Link to="/listings">
                    Browse Materials
                  </Link>
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </section>
  );
};

export default Hero;
