'use client';

import styles from './PropsTable.module.css';

interface PropDefinition {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

interface PropsTableProps {
  props: PropDefinition[];
  title?: string;
}

export default function PropsTable({ props, title = 'Props' }: PropsTableProps) {
  return (
    <div className={styles.propsTableContainer}>
      <h3 className={styles.propsTitle}>{title}</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.propsTable}>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Required</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {props.map((prop) => (
              <tr key={prop.name}>
                <td className={styles.propName}>
                  <code>{prop.name}</code>
                </td>
                <td className={styles.propType}>
                  <code>{prop.type}</code>
                </td>
                <td className={styles.propRequired}>
                  {prop.required ? (
                    <span className={styles.badge + ' ' + styles.badgeRequired}>
                      Yes
                    </span>
                  ) : (
                    <span className={styles.badge + ' ' + styles.badgeOptional}>
                      No
                    </span>
                  )}
                </td>
                <td className={styles.propDefault}>
                  {prop.default ? <code>{prop.default}</code> : '-'}
                </td>
                <td className={styles.propDescription}>{prop.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
