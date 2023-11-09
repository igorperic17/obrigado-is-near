import Card from "./Card/Card";
import "./stylesTempContainer.css";

const DATA = [
  {
    id: 1,
    title: "Protein interaction",
    description: "Train a network to predict proten docking site for various proteins suing molecular dynamics simulation.",
    isOpen: false,
    isFavorite: true,
    prizeBounty: 15,
    usersCount: 3,
    imgUrl:
      "https://images.pexels.com/photos/4194850/pexels-photo-4194850.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  },
  {
    id: 2,
    title: "GPT-5",
    description: "The largest and most accurate next-generation LLM humanity has ever trained.",
    isOpen: false,
    isFavorite: false,
    prizeBounty: 300000,
    usersCount: 1,
    imgUrl:
      "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=2605&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 3,
    title: "Hot dog",
    description: "Iconic hot dog vs. not hot dog detector. Every hacker's first step into the world of deep tech.",
    isOpen: true,
    isFavorite: false,
    prizeBounty: 1.5,
    usersCount: 5,
    imgUrl:
      "https://plus.unsplash.com/premium_photo-1679314213957-909df10381ac?q=80&w=3027&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 4,
    title: "nanoGPT",
    description: "Andrey Karpathy's nanoGPT trained on Shakespeare's sonnets. Small, but simple to understand intro to LLMs.",
    isOpen: true,
    isFavorite: true,
    prizeBounty: 50,
    usersCount: 10,
    imgUrl:
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 6,
    title: "ETL pipeline",
    description: "Streamlined extraction, transformation, and loading of massive datasets into a data warehouse for enhanced business intelligence.",
    isOpen: true,
    isFavorite: false,
    prizeBounty: 10,
    usersCount: 5,
    imgUrl:
      "https://plus.unsplash.com/premium_photo-1679314213957-909df10381ac?q=80&w=3027&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: 5,
    title: "Sentiment Analysis",
    description: "NLP-driven sentiment extraction from customer feedback to drive business strategy and product improvements.",
    isOpen: false,
    isFavorite: false,
    prizeBounty: 20,
    usersCount: 1,
    imgUrl:
      "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=2605&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },

  {
    id: 7,
    title: "Predictive Maintenance",
    description: "Automated machine learning pipeline that processes historical sensor data to predict equipment failures before they happen.",
    isOpen: true,
    isFavorite: true,
    prizeBounty: 40,
    usersCount: 10,
    imgUrl:
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const TempContainer = () => {
  return (
    <div className="cards_container">
      {DATA.map((x) => (
        <Card key={x.id} {...x} />
      ))}
    </div>
  );
};

export default TempContainer;
