// --- CONFIGURATION ARCADE TALON (Base Network) ---
const ADMIN_WALLET = "0x872bD846596Cc1aEde8Fd800997d242e3473fA83";
const TALON_TOKEN_ADDR = "0x0c6417054F8B303DdB821B1349124d656eA4BE13"; 
const NFT_ELITE = "0xa2A15fFaA85D3deC725aEFaED66c9C5141aC35A8"; // 50 ex.
const NFT_GENERAL = "0x57D361170e2F8E7e4490D14120eA93D551c99deF"; // 3333 ex.

const ABI_MINIMAL = [
    "function balanceOf(address owner, uint256 id) view returns (uint256)", 
    "function balanceOf(address owner) view returns (uint256)",           
    "function transfer(address to, uint256 amount) returns (bool)"         
];

async function checkGameAccess(gameId) {
    const id = gameId.toLowerCase();
    
    // 1. Vérification Wallet
    if (typeof window.ethereum === 'undefined') {
        alert("🦅 Accès Pilote : Connectez votre Wallet (Base Network).");
        return false;
    }

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const contractElite = new ethers.Contract(NFT_ELITE, ABI_MINIMAL, provider);
        const contractGeneral = new ethers.Contract(NFT_GENERAL, ABI_MINIMAL, provider);

        // Récupération des balances NFT
        const hasElite = await contractElite.balanceOf(address, 1);
        const hasGeneral = await contractGeneral.balanceOf(address, 1);

        // --- NIVEAU 1 : POSSESSEURS NFT ELITE (50 ex) ---
        // Accès total à tout l'arcade sans exception
        if (Number(hasElite) > 0) return true;

        // --- NIVEAU 2 : JEUX ÉLITE (Mines & Jump) ---
        // Si on arrive ici, l'utilisateur n'a pas le NFT Elite
        if (id === 'mines' || id === 'jump') {
            alert("🚫 ÉLITE NEST : Ce jeu nécessite le NFT ELITE (50 exemplaires).");
            return false;
        }

        // --- NIVEAU 3 : POSSESSEURS NFT GENERAL (3333 ex) ---
        // Accès gratuit aux jeux publics
        if (Number(hasGeneral) > 0) return true;

        // --- NIVEAU 4 : UTILISATEURS STANDARDS (Freemium) ---
        // Une partie gratuite enregistrée dans le navigateur
        if (!localStorage.getItem(`free_play_${id}`)) {
            localStorage.setItem(`free_play_${id}`, "true");
            alert("🦅 Eagle Arcade : Première partie offerte !");
            return true;
        }

        // --- NIVEAU 5 : PAIEMENT À LA CARTE ---
        const price = (id === 'wheel') ? 1 : 10;
        if (confirm(`Partie gratuite épuisée ! Jouer pour ${price} $TALON ?`)) {
            return await executeTalonPayment(signer, price);
        }

    } catch (e) {
        console.error("Erreur Access:", e);
        alert("Erreur de connexion au Nest.");
    }
    return false;
}

async function executeTalonPayment(signer, amountRaw) {
    const tokenContract = new ethers.Contract(TALON_TOKEN_ADDR, ABI_MINIMAL, signer);
    try {
        const amount = ethers.parseUnits(amountRaw.toString(), 18); 
        const tx = await tokenContract.transfer(ADMIN_WALLET, amount);
        alert("🦅 Transaction en cours...");
        await tx.wait();
        alert("Paiement validé ! Bon vol.");
        return true;
    } catch (e) {
        alert("Paiement échoué ou annulé.");
        return false;
    }
}
