import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.*;

public class RiscVParser {

    static Map<String, String> opcodeMap = Map.ofEntries(
            Map.entry("add", "0110011"), Map.entry("sub", "0110011"), Map.entry("and", "0110011"),
            Map.entry("or", "0110011"), Map.entry("sll", "0110011"), Map.entry("slt", "0110011"),
            Map.entry("sra", "0110011"), Map.entry("srl", "0110011"), Map.entry("xor", "0110011"),
            Map.entry("mul", "0110011"), Map.entry("div", "0110011"), Map.entry("rem", "0110011"),
            Map.entry("addi", "0010011"), Map.entry("andi", "0010011"), Map.entry("ori", "0010011"),
            Map.entry("jalr", "1100111"), Map.entry("lb", "0000011"), Map.entry("ld", "0000011"),
            Map.entry("lh", "0000011"), Map.entry("lw", "0000011"), Map.entry("sb", "0100011"),
            Map.entry("sw", "0100011"), Map.entry("sd", "0100011"), Map.entry("sh", "0100011"),
            Map.entry("beq", "1100011"), Map.entry("bne", "1100011"), Map.entry("bge", "1100011"),
            Map.entry("blt", "1100011"), Map.entry("auipc", "0010111"), Map.entry("lui", "0110111"),
            Map.entry("jal", "1101111"));

    static Map<String, String> funct3Map = Map.ofEntries(
            Map.entry("add", "000"), Map.entry("sub", "000"), Map.entry("and", "111"),
            Map.entry("or", "110"), Map.entry("sll", "001"), Map.entry("slt", "010"),
            Map.entry("sra", "101"), Map.entry("srl", "101"), Map.entry("xor", "100"),
            Map.entry("mul", "000"), Map.entry("div", "100"), Map.entry("rem", "110"),
            Map.entry("addi", "000"), Map.entry("andi", "111"), Map.entry("ori", "110"),
            Map.entry("jalr", "000"), Map.entry("lb", "000"), Map.entry("ld", "011"),
            Map.entry("lh", "001"), Map.entry("lw", "010"), Map.entry("sb", "000"),
            Map.entry("sw", "010"), Map.entry("sd", "011"), Map.entry("sh", "001"),
            Map.entry("beq", "000"), Map.entry("bne", "001"), Map.entry("bge", "101"),
            Map.entry("blt", "100"));

    static Map<String, String> funct7Map = Map.ofEntries(
            Map.entry("add", "0000000"), Map.entry("sub", "0100000"),
            Map.entry("sra", "0100000"), Map.entry("srl", "0000000"),
            Map.entry("mul", "0000001"), Map.entry("div", "0000001"),
            Map.entry("rem", "0000001"));

    static Set<String> iFormatInstructions = Set.of("addi", "andi", "ori", "lb", "ld", "lh", "lw", "jalr");
    static Set<String> sFormatInstructions = Set.of("sw", "sh", "sb", "sd");
    static Set<String> sbFormatInstructions = Set.of("beq", "bne", "bge", "blt");
    static Set<String> uFormatInstructions = Set.of("auipc", "lui");
    static Set<String> ujFormatInstructions = Set.of("jal");

    static Map<String, Integer> labelAddress = new HashMap<>();
    static Map<Long, Long> dataSegment = new HashMap<>();
    static List<Map.Entry<Long, Long>> sortedDataSegment = new ArrayList<>();

    static boolean isIFormatInstruction(String inst) {
        return iFormatInstructions.contains(inst);
    }

    static boolean isSFormatInstruction(String inst) {
        return sFormatInstructions.contains(inst);
    }

    static boolean isSBFormatInstruction(String inst) {
        return sbFormatInstructions.contains(inst);
    }

    static boolean isUFormatInstruction(String inst) {
        return uFormatInstructions.contains(inst);
    }

    static boolean isUJFormatInstruction(String inst) {
        return ujFormatInstructions.contains(inst);
    }

    static int computeOffset(String label, int currentPC) {
        if (!labelAddress.containsKey(label)) {
            System.err.println("Error: Undefined label " + label);
            System.exit(1);
        }
        return labelAddress.get(label) - currentPC;
    }

    static String registerToBinary(String reg) {
        try {
            int regNum = Integer.parseInt(reg.substring(1));
            if (regNum < 0 || regNum > 31) {
                throw new IllegalArgumentException("Register out of range");
            }
            return String.format("%5s", Integer.toBinaryString(regNum)).replace(' ', '0');
        } catch (Exception e) {
            System.err.println("Error: Invalid register format!");
            System.exit(1);
        }
        return null;
    }

    public static String parseImmediate(String immStr, int bits) {
        int value;
        try {
            if (immStr.startsWith("0x") || immStr.startsWith("0X")) {
                // Hexadecimal
                value = Integer.parseInt(immStr.substring(2), 16);
            } else if (immStr.startsWith("0b") || immStr.startsWith("0B")) {
                // Binary
                value = Integer.parseInt(immStr.substring(2), 2);
            } else {
                // Decimal
                value = Integer.parseInt(immStr);
            }
        } catch (Exception e) {
            System.err.println("Error: Invalid immediate format!");
            System.exit(1); // Exit on error
            return null;
        }

        // Range checking for signed and unsigned values based on the number of bits
        if ((bits == 12 && (value < -2048 || value > 2047)) || (bits == 20 && (value < 0 || value > 1048575))) {
            System.err.println("Error: Immediate value out of range!");
            System.exit(1);
        }

        // Convert to binary with padding
        String binary;

        if (value < 0) {
            // If negative, calculate two's complement representation for the given number
            // of bits
            binary = Integer.toBinaryString((1 << bits) + value); // Two's complement trick
        } else {
            // If positive, just format as a binary string
            binary = Integer.toBinaryString(value);
        }

        // Ensure the result is the correct length by padding with leading zeros
        binary = String.format("%" + bits + "s", binary).replace(' ', '0');
        return binary;
    }

    static String parseRFormat(String inst, String rd, String rs1, String rs2) {
        return funct7Map.get(inst) + registerToBinary(rs2) + registerToBinary(rs1) +
                funct3Map.get(inst) + registerToBinary(rd) + opcodeMap.get(inst);
    }

    static String parseIFormat(String inst, String rd, String rs1, String imm) {
        return parseImmediate(imm, 12) + registerToBinary(rs1) + funct3Map.get(inst) +
                registerToBinary(rd) + opcodeMap.get(inst);
    }

    static String parseSFormat(String inst, String rs1, String rs2, String imm) {
        String immBin = parseImmediate(imm, 12);
        return immBin.substring(0, 7) + registerToBinary(rs2) + registerToBinary(rs1) +
                funct3Map.get(inst) + immBin.substring(7) + opcodeMap.get(inst);
    }

    static String parseSBFormat(String inst, String rs1, String rs2, String offset) {
        String off = parseImmediate(offset, 13);
        return off.charAt(0) + off.substring(2, 8) + registerToBinary(rs2) +
                registerToBinary(rs1) + funct3Map.get(inst) + off.substring(8, 12) +
                off.substring(1, 2) + opcodeMap.get(inst);
    }

    static String parseUFormat(String inst, String rd, String imm) {
        return parseImmediate(imm, 20) + registerToBinary(rd) + opcodeMap.get(inst);
    }

    static String parseUJFormat(String inst, String rd, String imm) {
        String bin = parseImmediate(imm, 21);
        return bin.charAt(0) + bin.substring(10, 20) + bin.charAt(9) +
                bin.substring(1, 9) + registerToBinary(rd) + opcodeMap.get(inst);
    }

    static String formatBinaryInstruction(String opcode, String funct3, String funct7,
            String rd, String rs1, String rs2, String imm) {
        String s = "";
        s += opcode + "-";
        if (funct3.length() != 0) {
            s += funct3 + "-";
        } else {
            s += "NULL-";
        }
        if (funct7.length() != 0) {
            s += funct7 + "-";
        } else {
            s += "NULL-";
        }

        if (rd.length() != 0) {
            s += rd + "-";
        } else {
            s += "NULL-";
        }

        if (rs1.length() != 0) {
            s += rs1 + "-";
        } else {
            s += "NULL-";
        }

        if (rs2.length() != 0) {
            s += rs2 + "-";
        } else {
            s += "NULL-";
        }

        if (imm.length() != 0) {
            s += imm;
        } else {
            s += "NULL";
        }
        return s;
    }

    static void firstPass(BufferedReader inFile) throws IOException {
        String line;
        int address = 0;
        int dataAddress = 0x10000000;
        boolean inTextSegment = true;

        while ((line = inFile.readLine()) != null) {
            // Remove comments
            int commentPos = line.indexOf('#');
            if (commentPos != -1) {
                line = line.substring(0, commentPos);
            }

            // Skip empty or whitespace-only lines
            if (line.trim().isEmpty())
                continue;

            // Split the line into words
            String[] words = line.trim().split("\\s+");
            if (words.length == 0)
                continue;

            String firstWord = words[0];

            // Segment directives
            if (firstWord.equals(".text")) {
                inTextSegment = true;
                continue;
            } else if (firstWord.equals(".data")) {
                inTextSegment = false;
                continue;
            }

            // Handle labels (both .text and .data)
            if (firstWord.endsWith(":")) {
                String label = firstWord.substring(0, firstWord.length() - 1);
                if (inTextSegment) {
                    labelAddress.put(label, address);
                } else {
                    labelAddress.put(label, dataAddress);
                }

                // Remove label from words for further processing
                words = Arrays.copyOfRange(words, 1, words.length);
                if (words.length == 0)
                    continue;
                firstWord = words[0];
            }

            if (inTextSegment) {
                if (firstWord.endsWith(":")) {
                    // Label found, remove the trailing colon and store the label address
                    String label = firstWord.substring(0, firstWord.length() - 1);
                    labelAddress.put(label, address);

                    // Check if it's a valid opcode and increment the address if valid
                    if (opcodeMap.containsKey(firstWord)) {
                        address += 4;
                    }
                } else {
                    address += 4;
                }
            } else {
                // Handle data directives
                String directive = firstWord;

                switch (directive) {
                    case ".byte":
                        for (int i = 1; i < words.length; i++) {
                            try {
                                long value = Long.decode(words[i]);
                                dataSegment.put((long) dataAddress, value);
                                dataAddress += 1;
                            } catch (NumberFormatException e) {
                                System.err.println("Invalid byte value: " + words[i]);
                            }
                        }
                        break;

                    case ".half":
                        for (int i = 1; i < words.length; i++) {
                            try {
                                long value = Long.decode(words[i]);
                                dataSegment.put((long) dataAddress, value);
                                dataAddress += 2;
                            } catch (NumberFormatException e) {
                                System.err.println("Invalid half value: " + words[i]);
                            }
                        }
                        break;

                    case ".word":
                        for (int i = 1; i < words.length; i++) {
                            try {
                                int value = Integer.decode(words[i]);
                                // Store in little-endian (LSB first)
                                for (int j = 0; j < 4; j++) {
                                    long byteVal = (value >> (j * 8)) & 0xFF;
                                    dataSegment.put((long) dataAddress++, byteVal);
                                }
                            } catch (NumberFormatException e) {
                                System.err.println("Invalid word value: " + words[i]);
                            }
                        }
                        break;

                    case ".dword":
                        for (int i = 1; i < words.length; i++) {
                            try {
                                long value = Long.decode(words[i]);
                                // Store in little-endian (LSB first)
                                for (int j = 0; j < 8; j++) {
                                    long byteVal = (value >> (j * 8)) & 0xFF;
                                    dataSegment.put((long) dataAddress++, byteVal);
                                }
                            } catch (NumberFormatException e) {
                                System.err.println("Invalid dword value: " + words[i]);
                            }
                        }
                        break;

                    case ".asciz":
                        int startIdx = line.indexOf('"');
                        int endIdx = line.lastIndexOf('"');
                        if (startIdx != -1 && endIdx > startIdx) {
                            String str = line.substring(startIdx + 1, endIdx);
                            for (char c : str.toCharArray()) {
                                dataSegment.put((long) dataAddress++, (long) c);
                            }
                            dataSegment.put((long) dataAddress++, 0L); // Null terminator
                        } else {
                            System.err.println("Invalid .asciz format in line: " + line);
                        }
                        break;

                    default:
                        System.err.println("Unknown directive: " + directive);
                }
            }
        }

    }

    public static void assemble(String inputFile, String outputFile) {
        try (BufferedReader inFile = new BufferedReader(new FileReader(inputFile));
                BufferedWriter outFile = new BufferedWriter(new FileWriter(outputFile))) {

            // First pass for parsing and setting up labels
            BufferedReader inFile2 = new BufferedReader(new FileReader(inputFile));
            firstPass(inFile2);

            String line;
            int address = 0;
            boolean inTextSegment = true;

            while ((line = inFile.readLine()) != null) {
                line = line.trim();

                // Remove comments
                int commentPos = line.indexOf('#');
                if (commentPos != -1) {
                    line = line.substring(0, commentPos).trim();
                }

                if (line.isEmpty()) {
                    continue;
                }

                String[] words = line.split("\\s+");
                String inst = words[0];

                // Handle sections
                if (inst.equals(".text")) {
                    inTextSegment = true;
                    continue;
                } else if (inst.equals(".data")) {
                    inTextSegment = false;
                    continue;
                }

                if (!inTextSegment) {
                    continue; // Skip data segment
                }

                String rs1, rs2, rd, imm, offsetOrLabel;
                String formattedInstruction;

                if (opcodeMap.containsKey(inst)) {

                    // R-Type Instruction (like ADD, SUB)
                    if (funct3Map.containsKey(inst) && funct7Map.containsKey(inst)) {
                        // R-Type
                        rd = words[1];
                        rs1 = words[2];
                        rs2 = words[3];
                        String machineCode = parseRFormat(inst, rd, rs1, rs2);
                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), funct3Map.get(inst), funct7Map.get(inst),
                                registerToBinary(rd), registerToBinary(rs1), registerToBinary(rs2), "");
                        outFile.write(String.format("0x%X 0x%08X , %s # %s%n", address,
                                Long.parseLong(machineCode, 2), line, formattedInstruction));

                    } else if (isSFormatInstruction(inst)) {
                        // S-Type
                        rs2 = words[1];
                        imm = words[2];
                        rs1 = words[3];

                        String machineCode = parseSFormat(inst, rs1, rs2, imm);
                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), funct3Map.get(inst), "", "", registerToBinary(rs1),
                                registerToBinary(rs2), parseImmediate(imm, 12));

                        outFile.write(String.format("0x%X 0x%08X , %s # %s%n", address,
                                Long.parseLong(machineCode, 2), line, formattedInstruction));

                    } else if (isSBFormatInstruction(inst)) {
                        // SB-Type (e.g., BEQ, BNE)
                        rs1 = words[1];
                        rs2 = words[2];
                        offsetOrLabel = words[3];
                        String offset = offsetOrLabel.matches("-?\\d+") ? offsetOrLabel
                                : String.valueOf(computeOffset(offsetOrLabel, address));

                        String machineCode = parseSBFormat(inst, rs1, rs2, offset);
                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), funct3Map.get(inst), "", "", registerToBinary(rs1),
                                registerToBinary(rs2), parseImmediate(offset, 13));

                        outFile.write(String.format("0x%X 0x%08X , %s # %s%n", address,
                                Long.parseLong(machineCode, 2), line, formattedInstruction));

                    } else if (isIFormatInstruction(inst)) {
                        // I-Type instruction

                        if (inst.equals("lw") || inst.equals("lb") || inst.equals("ld") || inst.equals("lh")) {
                            // Support both "lw rd, imm(rs1)" and "lw rd imm rs1"
                            rd = words[1];
                            String immWithReg = words[2];

                            if (immWithReg.contains("(")) {
                                // Handle "lw rd, imm(rs1)"
                                int openParen = immWithReg.indexOf('(');
                                int closeParen = immWithReg.indexOf(')');
                                imm = immWithReg.substring(0, openParen);
                                rs1 = immWithReg.substring(openParen + 1, closeParen);
                            } else {
                                // Handle "lw rd imm rs1"
                                imm = immWithReg;
                                rs1 = words[3];
                            }

                        } else if (inst.equals("jalr")) {
                            // Support both "jalr rd, imm(rs1)" and "jalr rd, rs1, imm"
                            rd = words[1];
                            String immOrRs1 = words[2];

                            if (immOrRs1.contains("(")) {
                                // Handle "jalr rd, imm(rs1)"
                                int openParen = immOrRs1.indexOf('(');
                                int closeParen = immOrRs1.indexOf(')');
                                imm = immOrRs1.substring(0, openParen);
                                rs1 = immOrRs1.substring(openParen + 1, closeParen);
                            } else {
                                // Handle "jalr rd, rs1, imm"
                                rs1 = immOrRs1;
                                imm = words[3];
                            }

                        } else {
                            // Handle generic I-format: addi rd, rs1, imm
                            rd = words[1];
                            rs1 = words[2];
                            imm = words[3];
                        }

                        // Convert imm to 12-bit binary string, handle sign extension if needed
                        String immBinary = parseImmediate(imm, 12); // Assume parseImmediate returns 12-bit binary
                                                                    // string
                        String machineCode = parseIFormat(inst, rd, rs1, imm);

                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), funct3Map.get(inst), "",
                                registerToBinary(rd), registerToBinary(rs1), "",
                                immBinary);

                        outFile.write(String.format(
                                "0x%X 0x%08X , %s # %s%n",
                                address,
                                Long.parseLong(machineCode, 2),
                                line,
                                formattedInstruction));
                    } else if (isUFormatInstruction(inst)) {
                        // U-Type (e.g., LUI)
                        rd = words[1];
                        imm = words[2];
                        String machineCode = parseUFormat(inst, rd, imm);
                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), "", "", registerToBinary(rd), "", "", parseImmediate(imm, 20));

                        outFile.write(String.format("0x%X 0x%08X , %s # %s%n", address,
                                Long.parseLong(machineCode, 2), line, formattedInstruction));

                    } else if (isUJFormatInstruction(inst)) {
                        // UJ-Type (e.g., JAL)
                        rd = words[1];
                        offsetOrLabel = words[2];

                        String offset = offsetOrLabel.matches("-?\\d+") ? offsetOrLabel
                                : String.valueOf(computeOffset(offsetOrLabel, address));

                        String machineCode = parseUJFormat(inst, rd, offset);
                        formattedInstruction = formatBinaryInstruction(
                                opcodeMap.get(inst), "", "", registerToBinary(rd), "", "", parseImmediate(offset, 13));

                        outFile.write(String.format("0x%X 0x%08X , %s # %s%n", address,
                                Long.parseLong(machineCode, 2), line, formattedInstruction));
                    }

                    address += 4; // Increment address by 4 for each instruction
                }
            }

            // Write the "end" marker at the end of the output file
            outFile.write(String.format("0x%08X 0xdeadbeef , ends%n", address));
            List<Map.Entry<Long, Long>> sortedDataSegment = new ArrayList<>(dataSegment.entrySet());

            // Sort by key (address)
            sortedDataSegment.sort(Map.Entry.comparingByKey());

            // Output formatted: address in hex, value in hex (2-digit)
            for (Map.Entry<Long, Long> entry : sortedDataSegment) {
                outFile.write(String.format("0x%X 0x%02X%n", entry.getKey(), entry.getValue()));
            }

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            System.out.println("Usage: java Assembler <input file> <output file>");
            return;
        }

        String inputFile = args[0];
        String outputFile = args[1];

        assemble(inputFile, outputFile);
    }
}
