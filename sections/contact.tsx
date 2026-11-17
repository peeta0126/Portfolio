import { ArrowUpRight, FileText, Github, Mail, Rss } from "lucide-react";
import { Container } from "@/components/container";
import { contact } from "@/data/contact";
import { profile } from "@/data/profile";

export function Contact() {
  const links = [
    ...(contact.email
      ? [{ label: "Email", href: `mailto:${contact.email}`, icon: Mail, external: false }]
      : []),
    { label: "GitHub", href: contact.github, icon: Github, external: true },
    { label: "이력서 보기", href: profile.resumeUrl, icon: FileText, external: true },
    ...(contact.blog
      ? [{ label: "Blog", href: contact.blog, icon: Rss, external: true }]
      : []),
  ];

  return (
    <footer id="contact" className="py-14 sm:py-16">
      <Container>
        <p className="section-label">06 — Contact</p>
        <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          새로운 기회와 협업에
          열려 있습니다.
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {links.map(({ label, href, icon: Icon, external }) => (
            <a
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <Icon aria-hidden="true" size={15} />
              {label}
              <ArrowUpRight aria-hidden="true" size={14} />
            </a>
          ))}
        </div>
        <p className="mt-10 text-xs text-zinc-500">
          © {new Date().getFullYear()} 이민석
        </p>
      </Container>
    </footer>
  );
}
