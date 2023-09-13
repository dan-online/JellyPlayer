/** @format */
import PropTypes from "prop-types";

import { useNavigate } from "react-router-dom";

import MuiCard from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import { Blurhash } from "react-blurhash";

import { TypeIconCollectionCard } from "../utils/iconsCollection";
import "./card.module.scss";
import { MdiCheck } from "../icons/mdiCheck";

import LikeButton from "../buttons/likeButton";
import MarkPlayedButton from "../buttons/markPlayedButton";
import PlayButton from "../buttons/playButton";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client";
import { MdiAccountTie } from "../icons/mdiAccountTie";

const cardImageAspectRatios = {
	thumb: 1.777,
	portrait: 0.666,
	square: 1,
};

const availableSpecialRoutes = [BaseItemKind.Series];

/**
 * @typedef {Object} Props
 * @property {import("@jellyfin/sdk/lib/generated-client/models").BaseItemDto} item
 * @property {string}  cardTitle
 * @property {string | number}  cardCaption
 * @property {string} imageBlurhash
 * @property {string} seriesId
 * @property {boolean} hideText
 * @property {() => {}} onClick
 * @property {boolean} disablePadding
 */

/**
 * @description Hero section for item pages
 * @param {Props}
 * @returns {React.Component}
 */

export const ActorCard = ({
	item,
	cardTitle,
	cardCaption,
	imageBlurhash,
	seriesId,
	hideText,
	onClick,
	disablePadding,
}) => {
	const navigate = useNavigate();
	const defaultOnClick = () => {
		navigate(`/person/${item.Id}`);
	};
	return (
		<CardActionArea
			style={{
				padding: disablePadding ? 0 : "0.6em",
				borderRadius: "calc(0.6em + 6px)",
			}}
			className="card-container"
			onClick={!!onClick ? onClick : defaultOnClick}
		>
			<MuiCard className="card card-actor" elevation={0}>
				<div className="card-box">
					<div
						className="card-image-container"
						style={{
							aspectRatio: 1,
						}}
					>
						{!!imageBlurhash && (
							<Blurhash
								hash={imageBlurhash}
								width={128}
								height={128}
								resolutionX={24}
								resolutionY={24}
								className="card-image-blurhash"
							/>
						)}
						<div className="card-image-icon-container">
							<MdiAccountTie className="card-image-icon" />
						</div>
						<img
							src={window.api.getItemImageUrl(
								!!seriesId ? item.SeriesId : item.Id,
								"Primary",
								{
									quality: 80,
									fillHeight: 448,
									fillWidth: 448,
								},
							)}
							style={{
								height: "100%",
								width: "100%",
								opacity: 0,
							}}
							loading="lazy"
							onLoad={(e) => (e.target.style.opacity = 1)}
							className="card-image"
						/>
					</div>
					<div
						className="card-text-container"
						style={{ display: hideText ? "none" : "block" }}
					>
						<Typography
							variant="subtitle1"
							fontWeight={500}
							noWrap
							textAlign="center"
							style={{ opacity: 0.9 }}
						>
							{cardTitle}
						</Typography>
						<Typography
							variant="subtitle2"
							noWrap
							textAlign="center"
							style={{ opacity: 0.6 }}
							lineHeight="auto"
						>
							{cardCaption}
						</Typography>
					</div>
				</div>
			</MuiCard>
		</CardActionArea>
	);
};