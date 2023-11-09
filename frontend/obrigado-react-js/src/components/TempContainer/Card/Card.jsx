import FavoriteIcon from "@mui/icons-material/Favorite";
import VerifiedIcon from "@mui/icons-material/Verified";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import "./stylesCard.css";
import { useState } from "react";

const Card = (props) => {
  const {
    title,
    description,
    imgUrl,
    isOpen,
    prizeBounty,
    usersCount,
    isFavorite,
  } = props;

  const [isFav, setIsFav] = useState(isFavorite);

  return (
    <div className="card">
      <button
        className={`btn-favorite ${isFav ? "favorite" : ""}`}
        onClick={() => setIsFav((prev) => !prev)}
      >
        <FavoriteIcon />
      </button>

      <img src={imgUrl} alt="card" />

      <div className="content">
        <div className="letters">RS</div>

        <h1>
          <VerifiedIcon />
          {title}
          <span className={`open-box ${isOpen ? "open" : "closed"}`}>
            {isOpen ? "done" : "in queue"}
          </span>
        </h1>

        <p>{description}</p>

        <ul className="properties-list">
          <li>
            <div className="image-wrapper">
              <EventAvailableIcon />
            </div>
            Today
          </li>
          <li>
            <div className="image-wrapper">
              <EmojiEventsIcon />
            </div>
            {`${prizeBounty.toFixed(2)}$ in prizes`}
          </li>
          <li>
            <div className="image-wrapper">
              <PersonIcon />
            </div>
            {usersCount}
          </li>
        </ul>

        {isOpen && <a className="link-get-bounty" href="/" target="_blank">
          Donwload results
        </a>}
      </div>
    </div>
  );
};

export default Card;
