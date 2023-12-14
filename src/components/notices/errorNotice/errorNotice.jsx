/** @format */
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { red } from "@mui/material/colors";

export const ErrorNotice = ({ error, resetErrorBoundary }) => {
	console.error(error);
	return (
		<Box
			sx={{
				width: "100%",
				height: "100vh",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				flexFlow: "column",
				// opacity: 0.2,
			}}
		>
			<div
				className="material-symbols-rounded animate-icon"
				style={{
					fontSize: "10em",
					color: red[800],
					"--clr": "rgb(198 40 40 / 30%)",
					fontVariationSettings:
						'"FILL" 0, "wght" 100, "GRAD" 25, "opsz" 40',
				}}
			>
				error
			</div>
			<Typography variant="h3" fontWeight={100}>
				Something went wrong
			</Typography>
			<Typography
				fontFamily="JetBrains Mono Variable"
				fontWeight={100}
				variant="h5"
				style={{
					padding: "0.5em",
					background: "rgb(0 0 0 / 1)",
					borderRadius: "8px",
					border: "2px dashed rgb(255 255 255 / 0.5)",
					maxWidth: "40em",
					marginTop: "1em",
					// opacity: 0.6,
				}}
			>
				{error.message}
			</Typography>
			<Button
				size="large"
				variant="contained"
				onClick={resetErrorBoundary ? resetErrorBoundary : () => {}}
				style={{
					marginTop: "1em",
				}}
				color="info"
			>
				Close
			</Button>
			<Typography
				variant="subitle1"
				fontWeight={300}
				style={{
					marginTop: "1em",
				}}
			>
				Note: You need to click on CLOSE button if you change the
				page in order to close this error message
			</Typography>
		</Box>
	);
};
