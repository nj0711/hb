// frontend/src/components/Pagination.jsx
import { Button, Flex, Input, Text } from "@chakra-ui/react";
import { useState } from "react";

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const [jumpPage, setJumpPage] = useState("");

  if (totalPages <= 1) return null;

  const goToPage = () => {
    const num = Number(jumpPage);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpPage("");
    }
  };

  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  // Show only prev/current/next numbers
  const pageNumbers = [];
  if (currentPage > 1) pageNumbers.push(currentPage - 1);
  pageNumbers.push(currentPage);
  if (currentPage < totalPages) pageNumbers.push(currentPage + 1);

  return (
    <Flex
      justify="center"
      align="center"
      mt={6}
      gap={2}
      wrap="wrap"
      p={3}
      bg="gray.50"
      borderRadius="md"
      boxShadow="sm"
    >
      {/* Prev Button */}
      <Button
        size="sm"
        onClick={() => onPageChange(prevPage)}
        isDisabled={currentPage === 1}
      >
        Prev
      </Button>

      {/* Page Numbers */}
      {pageNumbers.map((p, idx) => (
        <Button
          key={idx}
          size="sm"
          colorScheme={p === currentPage ? "blue" : "gray"}
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      {/* Next Button */}
      <Button
        size="sm"
        onClick={() => onPageChange(nextPage)}
        isDisabled={currentPage === totalPages}
      >
        Next
      </Button>

      {/* Jump to page */}
      <Flex align="center" gap={2} ml={4}>
        <Text fontSize="sm">Go to:</Text>
        <Input
          size="sm"
          w="60px"
          type="number"
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && goToPage()}
        />
        <Text fontSize="sm">/ {totalPages}</Text>
        <Button size="sm" onClick={goToPage}>
          Go
        </Button>
      </Flex>
    </Flex>
  );
};

export default Pagination;
