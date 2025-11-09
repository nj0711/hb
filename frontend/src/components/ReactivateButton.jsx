import { Button, useToast } from "@chakra-ui/react";
import axios from "axios";

const ReactivateButton = () => {
  const toast = useToast();

  const handleReactivate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/users/reactivate", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: "Account reactivated!", status: "success" });
    } catch (err) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Something went wrong",
        status: "error",
      });
    }
  };

  return <Button colorScheme="green" onClick={handleReactivate}>Reactivate Account</Button>;
};

export default ReactivateButton;
