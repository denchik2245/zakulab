import { useState } from "react";
import { ContactPopupButton } from "@/components/contact-popup-button";
import { availableExtras, estimateProject, formatDays, formatPrice, paces, scopes, siteTypes, type Pace, type Scope, type Selection, type SiteType } from "@/lib/project-calculator";
import styles from "@/components/project-calculator.module.css";

type SocialLinks = { telegramUrl: string; maxUrl: string; vkUrl: string };

const initialSelection: Selection = { type: "landing", scope: "tilda", units: siteTypes.landing.included, extras: [], pace: "standard" };

function Choice({ name, checked, title, text, note, onChange }: { name: string; checked: boolean; title: string; text: string; note?: string; onChange: () => void }) {
  return (
    <label className={styles.choice}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span className={styles.radio} aria-hidden="true" />
      <strong>{title}</strong>
      <span className={styles.choiceText}>{text}</span>
      {note && <b className={styles.choiceNote}>{note}</b>}
    </label>
  );
}

export function ProjectCalculator({ socialLinks }: { socialLinks: SocialLinks }) {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const type = siteTypes[selection.type];
  const extras = availableExtras(selection.scope);
  const estimate = estimateProject(selection);
  const update = (patch: Partial<Selection>) => setSelection((previous) => ({ ...previous, ...patch }));
  const setUnits = (units: number) => update({ units: Math.min(type.max, Math.max(type.min, units)) });

  const summary = [
    "Расчёт проекта",
    ...estimate.lines.map((line) => `${line.title}: ${formatPrice(line.price)}`),
    `Итого: от ${formatPrice(estimate.total)}`,
    `Срок: ${formatDays(estimate.days)}`,
  ].join("\n");

  function chooseType(next: SiteType) {
    update({ type: next, units: siteTypes[next].included });
  }

  function chooseScope(next: Scope) {
    // Development-only extras do not apply to a design-only project.
    update({ scope: next, extras: selection.extras.filter((id) => availableExtras(next).some((extra) => extra.id === id)) });
  }

  function toggleExtra(id: string) {
    update({ extras: selection.extras.includes(id) ? selection.extras.filter((item) => item !== id) : [...selection.extras, id] });
  }

  return (
    <section className={styles.calculator} aria-label="Калькулятор стоимости">
      <div className={styles.grid}>
        <div className={styles.options}>
          <fieldset>
            <legend><span>01</span>Тип сайта</legend>
            <div className={styles.choices}>
              {(Object.keys(siteTypes) as SiteType[]).map((id) => (
                <Choice key={id} name="site-type" checked={selection.type === id} title={siteTypes[id].title} text={siteTypes[id].text} note={`от ${formatPrice(siteTypes[id].price[selection.scope])}`} onChange={() => chooseType(id)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>02</span>Что нужно сделать</legend>
            <div className={`${styles.choices} ${styles.twoColumns}`}>
              {(Object.keys(scopes) as Scope[]).map((id) => (
                <Choice key={id} name="scope" checked={selection.scope === id} title={scopes[id].title} text={scopes[id].text} onChange={() => chooseScope(id)} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>03</span>{type.unitLabel}</legend>
            <div className={styles.units}>
              <div className={styles.stepper}>
                <button type="button" onClick={() => setUnits(selection.units - 1)} disabled={selection.units <= type.min} aria-label="Меньше">−</button>
                <output aria-live="polite">{selection.units}</output>
                <button type="button" onClick={() => setUnits(selection.units + 1)} disabled={selection.units >= type.max} aria-label="Больше">+</button>
              </div>
              <input className={styles.range} type="range" min={type.min} max={type.max} value={selection.units} onChange={(event) => setUnits(Number(event.target.value))} aria-label={type.unitLabel} style={{ "--range-fill": `${((selection.units - type.min) / (type.max - type.min)) * 100}%` } as React.CSSProperties} />
            </div>
            <p className={styles.hint}>{type.unitHint} В базовую стоимость входит {type.included}, каждая следующая — {formatPrice(type.extraUnit[selection.scope])}.</p>
          </fieldset>

          <fieldset>
            <legend><span>04</span>Дополнительно</legend>
            <div className={styles.extras}>
              {extras.map((extra) => (
                <label key={extra.id} className={styles.extra}>
                  <input type="checkbox" checked={selection.extras.includes(extra.id)} onChange={() => toggleExtra(extra.id)} />
                  <span className={styles.checkbox} aria-hidden="true" />
                  <strong>{extra.title}</strong>
                  <span className={styles.choiceText}>{extra.text}</span>
                  <b className={styles.choiceNote}>+{formatPrice(extra.price(selection))}</b>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend><span>05</span>Сроки</legend>
            <div className={`${styles.choices} ${styles.twoColumns}`}>
              {(Object.keys(paces) as Pace[]).map((id) => (
                <Choice key={id} name="pace" checked={selection.pace === id} title={paces[id].title} text={paces[id].text} onChange={() => update({ pace: id })} />
              ))}
            </div>
          </fieldset>
        </div>

        <a className={styles.stickyTotal} href="#calculator-summary" aria-hidden="true" tabIndex={-1}><span>Итого</span><b>от {formatPrice(estimate.total)}</b><small>{formatDays(estimate.days)}</small></a>

        <aside className={styles.summary} id="calculator-summary" aria-live="polite">
          <span className={styles.summaryLabel}>{"{Ваш расчёт}"}</span>
          <p className={styles.total}><small>от</small> {formatPrice(estimate.total)}</p>
          <p className={styles.duration}>Срок: {formatDays(estimate.days)}</p>
          <ul className={styles.lines}>
            {estimate.lines.map((line) => <li key={line.title}><span>{line.title}</span><b>{formatPrice(line.price)}</b></li>)}
          </ul>
          <p className={styles.disclaimer}>Расчёт ориентировочный. Точную стоимость и срок назову после короткого обсуждения задачи.</p>
          <div className={styles.actions}>
            <ContactPopupButton triggerClassName={styles.send} title="Отправьте расчёт" description="Скопируйте расчёт или скачайте файл, затем отправьте его в удобном мессенджере." {...socialLinks} message={summary} messageLabel="Расчёт проекта" fileName="zakulab-project-estimate.txt">Отправить расчёт</ContactPopupButton>
            <button type="button" className={styles.reset} onClick={() => setSelection(initialSelection)}>Сбросить</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
