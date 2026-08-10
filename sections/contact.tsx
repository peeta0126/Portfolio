import { ArrowUpRight, Github, Mail, Rss } from "lucide-react";
import { Container } from "@/components/container";
import { contact } from "@/data/contact";

export function Contact() {
  const links = [
    ...(contact.email
      ? [{ label: "Email", href: `mailto:${contact.email}`, icon: Mail, external: false }]
      : []),
    { label: "GitHub", href: contact.github, icon: Github, external: true },
    ...(contact.blog
      ? [{ label: "Blog", href: contact.blog, icon: Rss, external: true }]
      : []),
  ];

  return (
    <footer id="contact" className="py-24">
      <Container>
        <p className="section-label">05 — Contact</p>
        <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
          새로운 기회와 협업에
          <br />
          열려 있습니다.
        </h2>
        <div className="mt-12 flex flex-wrap gap-3">
          {links.map(({ label, href, icon: Icon, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <Icon size={15} />
              {label}
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
        <p className="mt-20 text-xs text-zinc-500">
          © {new Date().getFullYear()} 이민석
        </p>
      </Container>
    </footer>
  );
}
