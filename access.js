// --- CONFIGURATION ARCADE TALON (Base Network) ---
const ADMIN_WALLET = "0x872bD846596Cc1aEde8Fd800997d242e3473fA83";
const TALON_TOKEN_ADDR = "0x0c6417054F8B303DdB821B1349124d656eA4BE13"; 
const NFT_ELITE = "0xa2A15fFaA85D3deC725aEFaED66c9C5141aC35A8";
const NFT_GENERAL = "0x57D361170e2F8E7e4490D14120eA93D551c99deF";

const ABI_MINIMAL = [
    "function balanceOf(address owner, uint256 id) view returns (uint256)", 
    "function balanceOf(address owner) view returns (uint256)",           
    "function transfer(address to, uint256 amount) returns (bool)"         
];

async function checkGameAccess(gameId) {
    const id = gameId.toLowerCase();
    
    // 1. Partie Gratuite (LocalStorage)
    if (!localStorage.getItem(`free_play_${id}`)) {
        localStorage.setItem(`free_play_${id}`, "true");
        alert("🦅 Bienvenue ! Votre première partie est offerte.");
        return true;
    }

    // 2. Vérification Wallet
    if (typeof window.ethereum === 'undefined') {
        alert("Ouvre l'arcade dans un Wallet (Coinbase Wallet, Metamask, Phantom) sur le réseau Base.");
        return false;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const contractElite = new ethers.Contract(NFT_ELITE, ABI_MINIMAL, provider);
        const contractGeneral = new ethers.Contract(NFT_GENERAL, ABI_MINIMAL, provider);

        const hasElite = await contractElite.balanceOf(address, 1);
        if (Number(hasElite) > 0) return true;

        const isPublicGame = ['tetris', 'snake', 'breaker', 'solitaire', 'wheel'].includes(id);
        const hasGeneral = await contractGeneral.balanceOf(address, 1);
        if (Number(hasGeneral) > 0 && isPublicGame) return true;

        if (confirm("Partie gratuite épuisée ! Jouer pour 10 $TALON ?")) {
            return await executeTalonPayment(signer, 10);
        }
    } catch (e) {
        console.error("Erreur Arcade:", e);
        alert("Erreur de connexion wallet.");
    }
    return false;
}

async function executeTalonPayment(signer, amountRaw) {
    const tokenContract = new ethers.Contract(TALON_TOKEN_ADDR, ABI_MINIMAL, signer);
    try {
        const amount = ethers.parseUnits(amountRaw.toString(), 18); 
        const tx = await tokenContract.transfer(ADMIN_WALLET, amount);
        alert("🦅 Transaction envoyée...");
        await tx.wait();
        alert("Paiement validé !");
        return true;
    } catch (e) {
        alert("Paiement échoué.");
        return false;
    }
}
