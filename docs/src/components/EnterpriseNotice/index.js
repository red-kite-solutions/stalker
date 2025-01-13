import React from "react";
import styles from "./EnterpriseNotice.module.css";

export default function EnterpriseNotice() {
  return (
    <div className={styles.enterpriseNotice}>
      <strong>✨ Unlock the Full Potential!</strong>
      <br />
      This feature is part of our <strong>Enterprise version</strong>, offering advanced tools and premium support to elevate your workflow.
      <a href="https://red-kite.io/contact.html" className={styles.link}>
        {" "}
        Get in touch today
      </a>{" "}
      and discover how we can help you achieve more!
    </div>
  );
}
