import { CREDITS } from "../data/credits";
import "./CreditsPanel.css";

export default function CreditsPanel() {
  return (
    <section className="credits">
      <p className="eyebrow">Sources</p>
      <h2>Credits</h2>
      <ul>
        {CREDITS.map((item) => (
          <li key={item.name}>
            <a href={item.href} target="_blank" rel="noreferrer">
              {item.name}
            </a>
            <p>{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
