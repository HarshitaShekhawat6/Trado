import React from "react";
import ListingCard from "../../listings/components/Listingcard";

const RecentCard = ({ item, navigation }) => {
  return (
    <ListingCard
      listing={item}
      variant="compact"
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    />
  );
};

export default RecentCard;