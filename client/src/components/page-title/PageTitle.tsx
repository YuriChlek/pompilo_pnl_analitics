import styles from './styles.module.css';

interface PageTitleProps {
    pageTitle: string;
}
export const PageTitle = ({ pageTitle }: PageTitleProps) => {
    return <h1 className={styles.title}>{pageTitle}</h1>;
};
