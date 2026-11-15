import { MEMBERS, TEAM_NAME } from "../data/team";
import { FacebookIcon, GitHubIcon, LinkedInIcon } from "./Icons";
import "./AboutPanel.css";

const LINKS = [
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "github", label: "GitHub", Icon: GitHubIcon },
];

function initials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AboutPanel() {
  return (
    <section className="about">
      <p className="eyebrow">Team</p>
      <h2>{TEAM_NAME}</h2>
      <p className="about-line">NASA Space Apps Challenge 2026 · Faisalabad</p>
      <div className="cards">
        {MEMBERS.map((member) => (
          <article key={member.name} className="member-card">
            <div className="avatar">
              {member.image ? (
                <img src={member.image} alt={member.name} />
              ) : (
                initials(member.name)
              )}
            </div>
            <h3>{member.name}</h3>
            <p>{member.bio}</p>
            <div className="socials">
              {LINKS.map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={member[key] || undefined}
                  target={member[key] ? "_blank" : undefined}
                  rel={member[key] ? "noreferrer" : undefined}
                  aria-label={`${member.name} on ${label}`}
                  onClick={(event) => {
                    if (!member[key]) event.preventDefault();
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
