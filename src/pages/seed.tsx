import Layout from "../components/Layout";
import { seedFirestore } from "../utils/seed";

export default function Seed() {
  async function handleSeed() {
    try {
      await seedFirestore();
      alert("Seed successful");
    } catch (err) {
      console.error(err);
      alert(`Seed failed: ${err}`);
    }
  }

  return (
    <Layout>
      <button onClick={handleSeed}>
        Seed Firestore
      </button>
    </Layout>
  );
}