import { useLanguage } from "../../context/LanguageContext";

// Prefix of each stat in translations.json: stats.<name>Count / stats.<name>Label
const stats = ["projects", "danish", "experience", "users"];

function StatsSection() {
    const { t } = useLanguage();

    return (
        <section className="stats-section">
            <div className="container stats-container">
                {stats.map((stat) => (
                    <div key={stat} className="stat-card">
                        <div className="stat-number gradient-text">{t(`stats.${stat}Count`)}</div>
                        <div className="stat-label">{t(`stats.${stat}Label`)}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default StatsSection;
