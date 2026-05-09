export const metadata = {
    title: 'Politique de confidentialite',
};

// TODO: Replace placeholders and adapt to your data processing practices.

export default function PolitiqueConfidentialitePage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="mb-8 text-3xl font-bold">
                Politique de confidentialite
            </h1>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    1. Responsable du traitement
                </h2>
                <p>[NOM DE LA SOCIETE]</p>
                <p>Email : [EMAIL DPO]</p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    2. Donnees collectees
                </h2>
                <ul className="list-inside list-disc space-y-1">
                    <li>Nom et adresse email (inscription)</li>
                    <li>Donnees de paiement (via Stripe, non stockees chez nous)</li>
                    <li>Donnees d&apos;utilisation (logs, analytics)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    3. Finalites du traitement
                </h2>
                <ul className="list-inside list-disc space-y-1">
                    <li>Fourniture et gestion du service</li>
                    <li>Facturation et gestion des abonnements</li>
                    <li>Amelioration du service (analytics anonymisees)</li>
                    <li>Communication (emails transactionnels)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    4. Base legale
                </h2>
                <p>
                    Le traitement est fonde sur l&apos;execution du contrat (CGU) et le
                    consentement de l&apos;utilisateur.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    5. Duree de conservation
                </h2>
                <p>
                    Les donnees sont conservees pendant la duree de l&apos;abonnement
                    et 3 ans apres la resiliation, conformement aux obligations legales.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">6. Vos droits</h2>
                <p>
                    Conformement au RGPD, vous disposez d&apos;un droit d&apos;acces,
                    de rectification, de suppression, de portabilite et
                    d&apos;opposition sur vos donnees. Contactez [EMAIL DPO].
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    7. Sous-traitants
                </h2>
                <ul className="list-inside list-disc space-y-1">
                    <li>Vercel (hebergement)</li>
                    <li>Supabase (base de donnees, authentification)</li>
                    <li>Stripe (paiements)</li>
                    <li>Resend (emails transactionnels)</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">8. Cookies</h2>
                <p>
                    Le site utilise des cookies strictement necessaires au
                    fonctionnement (authentification, session). Aucun cookie publicitaire
                    n&apos;est utilise.
                </p>
            </section>
        </div>
    );
}
