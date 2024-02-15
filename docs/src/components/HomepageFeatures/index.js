import Heading from "@theme/Heading";
import clsx from "clsx";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Extensibility",
    description: (
      <>Effortlessly customize our tool to fit your unique needs. Implement your own jobs using the tools you're accustomed to.</>
    ),
  },
  {
    title: "Effortless Automation",
    description: (
      <>
        Streamline tasks. Prioritize strategy, not routine. Simplify your workflow by automating routine security tasks. Our tool takes care
        of the groundwork, boosting your team's productivity and effectiveness.
      </>
    ),
  },
  {
    title: "Scalability",
    description: (
      <>
        Scale your security operations effortlessly as your infrastructure grows, ensuring comprehensive coverage and adaptability to
        evolving threats.
      </>
    ),
  },
];

function Feature({ title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center"></div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
