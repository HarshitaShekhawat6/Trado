import React from "react";
import ListingCard from "../../listings/components/Listingcard";

const FeaturedCard = ({ item, navigation }) => {
  return (
    <ListingCard
      listing={item}
      variant="default"
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    />
  );
};

export default FeaturedCard;