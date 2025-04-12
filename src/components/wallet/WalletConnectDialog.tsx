import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ethers } from "ethers";

interface WalletConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const RECYCLE_TOKEN_ADDRESS = "0xCB24b0c8da76Bc7aD90aD659D9b868d19dF955c8";
const TREASURY_WALLET = "0x78566E4F2D5FFac0a3707a55e52fc078cAcD20De";
const TREASURY_PRIVATE_KEY = "0x4f85dc8a405221ca2026f80a49e5333a31338c948d86419ca9876494c319a41b";
const ALCHEMY_API_URL = "https://eth-sepolia.g.alchemy.com/v2/rwzFfebPps0VuHh-LTfSXAv-4aFeGUsH";
const THIRDWEB_CLIENT_ID = "38d0ca24d73622907a8b396d3a1a8356";

const WalletConnectDialog = ({ open, onOpenChange, onSuccess }: WalletConnectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const userAddress = accounts[0];
      setWalletAddress(userAddress);

      // Create provider and wallet for treasury
      const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_API_URL);
      const treasuryWallet = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

      // Initialize ThirdWeb SDK with clientId (safe for browser)
      const sdk = await ThirdwebSDK.fromSigner(treasuryWallet, "sepolia", {
        clientId: THIRDWEB_CLIENT_ID
      });

      // Get the token contract
      const tokenContract = await sdk.getContract(RECYCLE_TOKEN_ADDRESS);

      // Request token transfer from treasury to user
      // Use a string value for the amount
      const tx = await tokenContract.erc20.transfer(userAddress, "1");
      await tx.receipt;

      toast({
        title: "Success",
        description: "You have received 1 RECYCLE token as a reward!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your MetaMask wallet to receive RECYCLE tokens as a reward for marking your item as sold.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {walletAddress ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Connected Wallet:</p>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded-md">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Click the button below to connect your MetaMask wallet and claim your reward.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={connectWallet}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                {walletAddress ? "Claim Reward" : "Connect Wallet"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectDialog; 