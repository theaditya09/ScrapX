import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { LucideGithub, LucideLinkedin, Mail, Lock } from "lucide-react";

const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });
  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInForm.email || !signInForm.password) {
      toast({
        title: "Missing information",
        description: "Please provide both email and password",
        variant: "destructive",
      });
      return;
    }
    await signIn(signInForm.email, signInForm.password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpForm.email || !signUpForm.password || !signUpForm.name) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    await signUp(signUpForm.email, signUpForm.password, {
      full_name: signUpForm.name,
      user_type: "user",
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 -mt-8">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="relative h-full flex flex-col md:flex-row md:h-[600px]">
          {/* Background gradient panel that moves with animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-emerald-500"
            animate={{
              x: isSignIn ? "50%" : "0%",
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
          
          <div className="absolute inset-0 flex flex-col md:flex-row">
            {/* Sign In/Sign Up Forms */}
            <AnimatePresence mode="wait">
              {isSignIn ? (
                <motion.div
                  key="signin"
                  className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 flex items-center justify-center"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full max-w-md space-y-4 md:space-y-5">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">Sign In</h2>
                    
                    <div className="flex justify-center space-x-4 mb-6">
                      <button className="p-2 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <LucideGithub className="w-5 h-5 text-emerald-600" />
                      </button>
                      <button className="p-2 border rounded-lg hover:bg-emerald-50 transition-colors">
                        <LucideLinkedin className="w-5 h-5 text-emerald-600" />
                      </button>
                    </div>

                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">
                          or use your email to sign in
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="Email"
                          value={signInForm.email}
                          onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                          className="pl-10 py-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                        <Mail className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="relative">
                        <Input
                          type="password"
                          placeholder="Password"
                          value={signInForm.password}
                          onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                          className="pl-10 py-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
                          required
                        />
                        <Lock className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="flex justify-end">
                        <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">
                          Forget Your Password?
                        </a>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 flex items-center justify-center"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full max-w-md space-y-3">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Create Account</h2>
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={signUpForm.name}
                        onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                        className="py-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />

                      <Input
                        type="email"
                        placeholder="Email"
                        value={signUpForm.email}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        className="py-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />

                      <Input
                        type="password"
                        placeholder="Password"
                        value={signUpForm.password}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        className="py-3 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 h-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        {isLoading ? "Creating account..." : "Sign Up"}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Overlay Content - shown on desktop, hidden initially on mobile */}
            <div className="hidden md:flex w-full md:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 items-center justify-center relative">
              <div className="w-full max-w-md text-center text-white relative z-10">
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">
                    {isSignIn ? "Hola, Amigo!" : "Welcome Back!"}
                  </h2>
                  <p className="text-lg md:text-xl mb-5">
                    {isSignIn
                      ? "Enter your personal details and start your journey with us"
                      : "To keep connected with us please login with your personal info"}
                  </p>
                  <Button
                    onClick={() => setIsSignIn(!isSignIn)}
                    className="border-2 border-white px-6 py-2 rounded-lg text-white bg-transparent hover:bg-white hover:text-emerald-600 transition-colors"
                  >
                    {isSignIn ? "Sign Up" : "Sign In"}
                  </Button>
                </motion.div>
              </div>
            </div>
            
            {/* Mobile version of toggle button - only shown on small screens */}
            <div className="flex md:hidden justify-center mt-6 pb-6">
              <Button
                onClick={() => setIsSignIn(!isSignIn)}
                className="border border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50"
              >
                {isSignIn ? "Need an account? Sign Up" : "Already have an account? Sign In"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
