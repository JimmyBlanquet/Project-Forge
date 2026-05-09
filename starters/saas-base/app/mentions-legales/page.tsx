export const metadata = {
    title: 'Mentions legales',
};

// TODO: Replace placeholders with your company information.

export default function MentionsLegalesPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="mb-8 text-3xl font-bold">Mentions legales</h1>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">Editeur du site</h2>
                <p>[NOM DE LA SOCIETE]</p>
                <p>[FORME JURIDIQUE] au capital de [MONTANT] euros</p>
                <p>Siege social : [ADRESSE]</p>
                <p>RCS [VILLE] [NUMERO]</p>
                <p>SIRET : [NUMERO]</p>
                <p>Directeur de la publication : [NOM]</p>
                <p>Email : [EMAIL]</p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">Hebergement</h2>
                <p>Vercel Inc.</p>
                <p>440 N Barranca Avenue #4133</p>
                <p>Covina, CA 91723, USA</p>
                <p>https://vercel.com</p>
            </section>

            <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                    Propriete intellectuelle
                </h2>
                <p>
                    L&apos;ensemble du contenu de ce site (textes, images, logos) est
                    protege par le droit d&apos;auteur. Toute reproduction est interdite
                    sans autorisation prealable.
                </p>
            </section>
        </div>
    );
}
