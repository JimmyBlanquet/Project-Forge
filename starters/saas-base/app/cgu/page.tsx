export const metadata = {
    title: "Conditions generales d'utilisation",
};

// TODO: Replace placeholders and adapt to your service.

export default function CGUPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="mb-8 text-3xl font-bold">
                Conditions generales d&apos;utilisation
            </h1>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">1. Objet</h2>
                <p>
                    Les presentes conditions generales d&apos;utilisation (CGU)
                    regissent l&apos;utilisation du service [NOM DU SERVICE] propose
                    par [NOM DE LA SOCIETE].
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    2. Acces au service
                </h2>
                <p>
                    Le service est accessible a toute personne disposant d&apos;un
                    acces internet. L&apos;inscription est necessaire pour acceder aux
                    fonctionnalites.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    3. Responsabilites
                </h2>
                <p>
                    L&apos;utilisateur s&apos;engage a utiliser le service de maniere
                    conforme a la loi et aux presentes CGU. [NOM DE LA SOCIETE] ne
                    saurait etre tenu responsable des dommages indirects lies a
                    l&apos;utilisation du service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    4. Abonnements et paiement
                </h2>
                <p>
                    Les abonnements sont geres via Stripe. Les tarifs sont indiques sur
                    la page de tarification. Tout abonnement est reconductible
                    tacitement sauf resiliation.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    5. Resiliation
                </h2>
                <p>
                    L&apos;utilisateur peut resilier son abonnement a tout moment
                    depuis son espace personnel. La resiliation prend effet a la fin de
                    la periode de facturation en cours.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    6. Modification des CGU
                </h2>
                <p>
                    [NOM DE LA SOCIETE] se reserve le droit de modifier les presentes
                    CGU. Les utilisateurs seront informes par email.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    7. Droit applicable
                </h2>
                <p>
                    Les presentes CGU sont soumises au droit francais. Tout litige sera
                    porte devant les tribunaux competents de [VILLE].
                </p>
            </section>
        </div>
    );
}
