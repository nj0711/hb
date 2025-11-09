import { StarIcon } from "@chakra-ui/icons";
import { HStack, Icon } from "@chakra-ui/react";

const StarRating = ({ rating, setRating, readOnly = false, size = "md" }) => {
  const stars = [1, 2, 3, 4, 5];

  const getStarColor = (star) => {
    if (rating >= star) return "yellow.400"; // full
    if (rating >= star - 0.5) return "yellow.200"; // half
    return "gray.300"; // empty
  };

  const starSize = size === "lg" ? "32px" : size === "md" ? "20px" : "16px";

  return (
    <HStack spacing={1}>
      {stars.map((star) => (
        <Icon
          as={StarIcon}
          key={star}
          boxSize={starSize}
          color={getStarColor(star)}
          cursor={readOnly ? "default" : "pointer"}
          onClick={() => !readOnly && setRating && setRating(star)}
        />
      ))}
    </HStack>
  );
};

export default StarRating;
