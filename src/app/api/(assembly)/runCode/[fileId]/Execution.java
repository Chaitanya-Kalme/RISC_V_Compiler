import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class Execution {

    private HashMap<String, String> memory;
    private HashMap<String, String> registerFile;

    Execution() {
        memory = new HashMap<>();
        registerFile = new HashMap<>();
        for (int i = 0; i < 32; i++) {
            String address = "x" + i;
            registerFile.put(address, "0x00000000");
        }
        registerFile.put("x2", "0x7FFFFFDC");
    }

    public void addToMemory(String address, String value) {
        memory.put(address, value);
    }

    public HashMap<String, String> getMemory() {
        return memory;
    }

    public HashMap<String, String> getRegisterFile() {
        return registerFile;
    }

    // data path
    private String mdr = null;
    private String pcMuxPc = "0x00000000";
    private String pcTemp = null;
    private String size = null;
    private String ra = null;
    private String rb = null;
    private String immMuxInr = null;
    private String rz = null;
    private String mar = null;
    private String ir = null;
    private String rs1 = null;
    private String rs2 = null;
    private String rd = null;
    private String valueRegister = null;
    private Integer clock = null;
    private String immMuxB = null;
    private String rm = null;
    private String ry = null;
    private HashMap<String, String> textSegment = null;

    public void setTextSegment(HashMap<String, String> textSegment) {
        this.textSegment = textSegment;
    }

    // Control Path
    private Boolean muxMdr = null;
    private Boolean muxMa = null;
    private Boolean muxB = null;
    private Integer muxY = null;
    private Boolean muxInr = null;
    private Boolean muxPc = null;
    private Boolean branch = null;
    private Boolean condition = null;
    private Boolean memRead = null;
    private String aluOp = null;
    private Boolean memWrite = null;
    private Boolean regWrite = null;

    public Boolean getMuxPc() {
        return muxPc;
    }

    public String getMdr() {
        return mdr;
    }

    public String getSize() {
        return size;
    }

    public Boolean getMuxMdr() {
        return muxMdr;
    }

    public Boolean getMuxB() {
        return muxB;
    }

    public Boolean getMemRead() {
        return memRead;
    }

    public String getRb() {
        return rb;
    }

    public Boolean getMemWrite() {
        return memWrite;
    }

    public Boolean getRegWrite() {
        return regWrite;
    }

    public String getAluOp() {
        return aluOp;
    }

    public String getPcTemp() {
        return pcTemp;
    }

    public Integer getClock() {
        return clock;
    }

    public Integer getMuxY() {
        return muxY;
    }

    public Boolean getMuxInr() {
        return muxInr;
    }

    public Boolean getMuxMa() {
        return muxMa;
    }

    public String getImmMuxB() {
        return immMuxB;
    }

    public String getImmMuxInr() {
        return immMuxInr;
    }

    public String getIr() {
        return ir;
    }

    public String getMar() {
        return mar;
    }

    public String getPcMuxPc() {
        return pcMuxPc;
    }

    public String getRa() {
        return ra;
    }

    public String getRd() {
        return rd;
    }

    public String getRm() {
        return rm;
    }

    public String getRs1() {
        return rs1;
    }

    public String getRs2() {
        return rs2;
    }

    public String getRy() {
        return ry;
    }

    public String getRz() {
        return rz;
    }

    public String getValueRegister() {
        return valueRegister;
    }

    public void fetch() {
        if (textSegment == null) {
            System.out.println("Error: Text Segment is not initialized!");
            return;
        }

        // Fetch the instruction from memory using PC

        String pcHex = pcMuxPc; // Get current PC value
        ir = textSegment.getOrDefault(pcHex, "0x00000000"); // Default to NOP if no instruction found

        // Convert PC from hex to integer, increment by 4, and store in pcTemp
        int pcValue = (int) Long.parseUnsignedLong(pcHex.substring(2), 16); // Convert hex string to integer
        pcValue += 4; // Increment PC by 4 (32-bit instruction size)
        pcTemp = "0x" + String.format("%08X", pcValue); // Convert back to hex string

        // Update the clock cycle
        if (clock == null) {
            clock = 0;
        }
        clock++;

        // Debugging output
        System.out.println("PC: " + pcHex);
        System.out.println("Clock Cycle: " + clock);
        System.out.println("Instruction Register (IR): " + ir);
    }

    public static int signExtend(String binary, int bitWidth) {
        int value = (int) Long.parseLong(binary, 2);
        if (binary.charAt(0) == '1') {
            // Sign extend: fill higher bits with 1s
            value |= -1 << bitWidth;
        }
        return value;
    }

    public void decode() {
        if (ir == null || ir.length() != 10) { // Ensure IR is valid (0xXXXXXXXX format)
            System.out.println("Error: Invalid instruction in IR");
            return;
        }

        String func3 = null;
        String func7 = null;
        // Convert hex instruction to binary (excluding "0x" prefix)
        String binary = String.format("%32s", Integer.toBinaryString(Integer.parseUnsignedInt(ir.substring(2), 16))).replace(' ', '0');

        // Extract opcode (bits 0-6)
        String opcode = binary.substring(25, 32);

        // Decode based on opcode
        switch (opcode) {
            case "0110011": {// R-Type (add, sub, and, or, sll, slt, sra, srl, xor, mul, div, rem)
                rd = binary.substring(20, 25);
                rs1 = binary.substring(12, 17);
                rs2 = binary.substring(7, 12);
                func3 = binary.substring(17, 20);
                func7 = binary.substring(0, 7);

                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");
                rb = registerFile.getOrDefault("x" + Integer.parseInt(rs2, 2), "0x00000000");

                // ALU operation lookup
                if (func3.equals("000")) {
                    aluOp = func7.equals("0000000") ? "ADD" :
                            func7.equals("0100000") ? "SUB" :
                                    func7.equals("0000001") ? "MUL" : "INVALID";
                } else if (func3.equals("111")) {
                    aluOp = "AND";
                } else if (func3.equals("110")) {
                    aluOp = func7.equals("0000001") ? "REM" : "OR";
                } else if (func3.equals("001")) {
                    aluOp = "SLL";
                } else if (func3.equals("010")) {
                    aluOp = "SLT";
                } else if (func3.equals("101")) {
                    aluOp = func7.equals("0000000") ? "SRL" :
                            func7.equals("0100000") ? "SRA" : "INVALID";
                } else if (func3.equals("100")) {
                    aluOp = func7.equals("0000000") ? "XOR" :
                            func7.equals("0000001") ? "DIV" : "INVALID";
                } else {
                    throw new IllegalArgumentException("Invalid R-type instruction");
                }
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting pc
                muxY = 0;
                branch = false;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = false;
                break;
            }

            case "0010011": {// I-Type (addi, andi, ori)
                rd = binary.substring(20, 25);
                rs1 = binary.substring(12, 17);
                func3 = binary.substring(17, 20);
                immMuxB = binary.substring(0, 12);

                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");

                // Sign-extend immMuxB to 32-bit
                int immValue = Integer.parseInt(immMuxB, 2);
                if (immMuxB.charAt(0) == '1') { // Negative number (sign extend)
                    immValue |= 0xFFFFF000;
                }
                immMuxB = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // ALU operation lookup
                switch (func3) {
                    case "000":
                        aluOp = "ADD";
                        break; // addi, lb, lh, lw, ld
                    case "111":
                        aluOp = "AND";
                        break; // andi
                    case "110":
                        aluOp = "OR";
                        break;  // ori
                    default:
                        throw new IllegalArgumentException("Invalid I-type instruction");
                }
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting pc
                muxY = 0;
                branch = false;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = true;
                break;

            }
            case "0000011": {// Load (lb, lh, lw, ld)
                rd = binary.substring(20, 25);
                rs1 = binary.substring(12, 17);
                func3 = binary.substring(17, 20);

                // Fetch rs1 value from the register file
                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");

                immMuxB = binary.substring(0, 12);
                // Extract and sign-extend the 12-bit immediate
                int immValue = Integer.parseInt(immMuxB, 2);
                if (immMuxB.charAt(0) == '1') { // If negative, sign-extend
                    immValue |= 0xFFFFF000;
                }
                immMuxB = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // Determine memory access size based on func3
                switch (func3) {
                    case "000": size = "BYTE"; break;  // lb (load byte)
                    case "001": size = "HALF"; break;  // lh (load half-word)
                    case "010": size = "WORD"; break;  // lw (load word)
                    case "011": size = "DOUBLE"; break; // ld (load double-word)
                    default: throw new IllegalArgumentException("Invalid load instruction");
                }

                // Set ALU operation to perform address computation (ra + imm)
                aluOp = "LOAD";

                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = true; // Selecting rz
                muxY = 1;
                branch = false;
                memRead = true;
                memWrite = false;
                regWrite = true;
                muxB = true;
                break;
            }

            case "1100111": {// JALR
                rd = binary.substring(20, 25);
                rs1 = binary.substring(12, 17);
                func3 = binary.substring(17, 20);
                immMuxInr = binary.substring(0, 12);
                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");

                // Sign-extend immMuxB to 32-bit
                int jalrImm = Integer.parseInt(immMuxInr, 2);
                if (immMuxInr.charAt(0) == '1') {
                    jalrImm |= 0xFFFFF000;
                }
                immMuxInr = String.format("%32s", Integer.toBinaryString(jalrImm)).replace(' ', '0');

                aluOp = "JALR";
                muxPc = true; // selecting ra
                muxInr = false;
                muxMa = false; // selecting pc
                muxY = 2;
                branch = true;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = null;
                break;
            }
            case "0100011": { // S-Type (sb, sw, sd, sh)
                rs1 = binary.substring(12, 17);
                rs2 = binary.substring(7, 12);
                func3 = binary.substring(17, 20);
                immMuxB = binary.substring(0, 7) + binary.substring(20, 25); // Immediate field
                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");
                rb = registerFile.getOrDefault("x" + Integer.parseInt(rs2, 2), "0x00000000");
                rm = rb;

                // Sign-extend immMuxB to 32-bit
                int immValue = Integer.parseInt(immMuxB, 2);
                if (immMuxB.charAt(0) == '1') { // Negative number (sign extend)
                    immValue |= 0xFFFFF000;
                }
                immMuxB = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // Determine size based on func3
                switch (func3) {
                    case "000": size = "BYTE"; break; // sb
                    case "001": size = "HALF"; break; // sh
                    case "010": size = "WORD"; break; // sw
                    case "011": size = "DOUBLE"; break; // sd
                    default: throw new IllegalArgumentException("Invalid S-type instruction");
                }

                aluOp = "STORE";
                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = true; // selecting rz
                muxY = null;
                branch = false;
                memRead = false;
                memWrite = true;
                regWrite = false;
                muxB = true;

                break;
            }
            case "1100011": { // SB-Type (beq, bne, bge, blt)
                rs1 = binary.substring(12, 17);
                rs2 = binary.substring(7, 12);
                func3 = binary.substring(17, 20);
                ra = registerFile.getOrDefault("x" + Integer.parseInt(rs1, 2), "0x00000000");
                rb = registerFile.getOrDefault("x" + Integer.parseInt(rs2, 2), "0x00000000");

                // Extract branch immediate & sign-extend it
                String immRaw = binary.substring(0, 1) + binary.substring(24, 25) + binary.substring(1, 7) + binary.substring(20, 24) + "0";
                System.out.println(immRaw);
                int immValue = Integer.parseInt(immRaw, 2);
                if (immRaw.charAt(0) == '1') { // Negative number (sign extend)
                    immValue |= 0xFFFFF000;
                }
                immMuxInr = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');
                immMuxB = immMuxInr;

                // Set ALU operation based on func3
                switch (func3) {
                    case "000": aluOp = "BEQ"; break; // beq
                    case "001": aluOp = "BNE"; break; // bne
                    case "100": aluOp = "BLT"; break; // blt
                    case "101": aluOp = "BGE"; break; // bge
                    default: throw new IllegalArgumentException("Invalid SB-type instruction");
                }

                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting pc
                muxY = null;
                branch = true;
                memRead = false;
                memWrite = false;
                regWrite = false;
                muxB = false;

                break;
            }

            case "0110111": { // U-Type (LUI)
                rd = binary.substring(20, 25);

                // Extract 20-bit immediate and shift left by 12 (LUI semantics)
                int immValue = Integer.parseInt(binary.substring(0, 20), 2) << 12;

                // Sign-extend to 32-bit
                if (binary.charAt(0) == '1') { // If MSB is 1 (negative number)
                    immValue |= 0xFFF00000; // Extend sign
                }

                immMuxB = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // Set ALU operation
                aluOp = "LUI";

                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting PC
                muxY = 0;
                branch = false;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = true;

                break;
            }

            case "0010111": { // U-Type (AUIPC)
                rd = binary.substring(20, 25);
                ra = pcMuxPc;
                // Extract 20-bit immediate and shift left by 12 (AUIPC semantics)
                int immValue = Integer.parseInt(binary.substring(0, 20), 2) << 12;

                // Sign-extend to 32-bit
                if (binary.charAt(0) == '1') { // If MSB is 1 (negative number)
                    immValue |= 0xFFF00000; // Extend sign
                }

                immMuxB = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // Set ALU operation
                aluOp = "AUIPC";

                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting PC
                muxY = 0;
                branch = false;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = true;

                break;
            }

            case "1101111": { // UJ-Type (JAL)
                rd = binary.substring(20, 25);

                // Extract 20-bit JAL immediate and rearrange the bits correctly
                String immBinary = binary.charAt(0) + binary.substring(12, 20) + binary.substring(11, 12) + binary.substring(1, 11) + "0";

                // Convert to signed integer
                int immValue = Integer.parseInt(immBinary, 2);

                // Sign-extend to 32-bit
                if (binary.charAt(0) == '1') { // If MSB is 1 (negative number)
                    immValue |= 0xFFE00000; // Extend sign
                }

                immMuxInr = String.format("%32s", Integer.toBinaryString(immValue)).replace(' ', '0');

                // Set ALU operation for JAL
                aluOp = "JAL";

                // Control signals
                muxPc = false;
                muxInr = false;
                muxMa = false; // selecting PC
                muxY = 2;
                branch = true;
                memRead = false;
                memWrite = false;
                regWrite = true;
                muxB = null;

                break;
            }

            default: {
                System.out.println("Error: Unsupported opcode " + opcode);
                return;
            }
        }
    }
    
    public void execute() {
        if (aluOp == null) {
            System.out.println("Error: ALU operation not set.");
            return;
        }

        // Convert ra and rb from hex to int, handling null cases
        int op1 = (ra != null) ? Integer.parseInt(ra.substring(2), 16) : 0;
        int op2 = 0;

        // Choose operand based on instruction type (rb may be null for I-type and store
        // instructions)
        if (muxB != null && muxB) {
            op2 = (immMuxB != null) ? (int) Long.parseLong(immMuxB, 2) : 0; // Immediate value for I-type & S-type
        } else if (rb != null) {
            op2 = (int) Long.parseLong(rb.substring(2), 16); // Register value for R-type & SB-type
        }

        int result = 0;

        // Execute ALU operation
        switch (aluOp) {
            case "ADD":
                result = op1 + op2;
                break;
            case "SUB":
                result = op1 - op2;
                break;
            case "MUL":
                result = op1 * op2;
                break;
            case "DIV":
                result = (op2 != 0) ? op1 / op2 : 0;
                break;
            case "REM":
                result = (op2 != 0) ? op1 % op2 : 0;
                break;
            case "AND":
                result = op1 & op2;
                break;
            case "OR":
                result = op1 | op2;
                break;
            case "XOR":
                result = op1 ^ op2;
                break;
            case "SLL":
                result = op1 << (op2 & 0x1F);
                break; // Masking to 5 bits for shift amount
            case "SRL":
                result = op1 >>> (op2 & 0x1F);
                break;
            case "SRA":
                result = op1 >> (op2 & 0x1F);
                break;
            case "SLT":
                result = (op1 < op2) ? 1 : 0;
                break;
            case "LUI":
                result = op2;
                break; // LUI directly loads the immediate
            case "AUIPC":
                result = op1 + op2;
                break; // AUIPC adds immediate to PC
            case "JAL":
                int currentPc = Integer.decode(pcMuxPc); // Get current PC value
                int returnAddr = currentPc + 4;
                rz = String.format("0x%08X", returnAddr);
            
                int imm = (int) Long.parseLong(immMuxInr, 2);
                int targetAddress = currentPc + imm;
                pcMuxPc = String.format("0x%08X", targetAddress);
                System.out.println(pcMuxPc);
            
                muxY = 2; // IMPORTANT: Forward return address to rd
                condition = true;
                break;
            
            case "JALR":
                int raVal = Integer.decode(ra);
                int currentPC = Integer.decode(pcMuxPc);
                imm = Integer.parseInt(immMuxInr, 2);
                targetAddress = (raVal + imm) & ~1;
            
                
                returnAddr = currentPC + 4;
                rz = String.format("0x%08X", returnAddr);
                pcMuxPc = String.format("0x%08X", targetAddress);
                
                muxY = 2; // IMPORTANT: Forward return address to rd
                condition = true;
                break;
            case "BEQ":
                condition = (op1 == op2);
                if (condition) {
                    currentPC = Integer.decode(pcMuxPc);
                    imm = (int) Long.parseLong(immMuxB,2);
                    targetAddress = currentPC + imm;  // Update target address based on immediate
                    pcMuxPc = String.format("0x%08X", targetAddress);
                }else{
                    pcMuxPc = pcTemp;
                }
                break;
            case "BNE":
                condition = (op1 != op2);
                if (condition) {
                    currentPC = Integer.decode(pcMuxPc);
                    imm = Integer.parseInt(immMuxB,2);
                    targetAddress = currentPC + imm;  // Update target address based on immediate
                    pcMuxPc = String.format("0x%08X", targetAddress);
                }else{
                    pcMuxPc = pcTemp;
                }
                break;
            case "BLT":
                condition = (op1 < op2);
                if (condition) {
                    currentPC = Integer.decode(pcMuxPc);
                    imm = Integer.parseInt(immMuxB,2);
                    targetAddress = currentPC + imm;  // Update target address based on immediate
                    pcMuxPc = String.format("0x%08X", targetAddress);
                }else{
                    pcMuxPc = pcTemp;
                }
                break;
            case "BGE":
                condition = (op1 >= op2);
                if (condition) {
                    currentPC = Integer.decode(pcMuxPc);
                    imm = Integer.parseInt(immMuxB,2);
                    targetAddress = currentPC + imm;  // Update target address based on immediate
                    pcMuxPc = String.format("0x%08X", targetAddress);
                }else{
                    pcMuxPc = pcTemp;
                }
                break;
            case "LOAD":
                result = op1 + op2;
                break; // Compute effective address for load
            case "STORE":
                result = op1 + op2;
                break; // Compute effective address for store
            default:
                System.out.println("Error: Unsupported ALU operation " + aluOp);
                return;
        }

        if (aluOp != null && !aluOp.startsWith("J") && !aluOp.startsWith("B")) {
            rz = "0x" + String.format("%08X", result);
            int nextPc = Integer.decode(pcMuxPc) + 4; // Increment PC by 4 for regular instructions
            pcMuxPc = String.format("0x%08X", nextPc); // Update pcMuxPc
        }

        // Handle branch condition (update PC if branch is taken)
        if (branch != null && branch) {
            if (condition) {
                muxInr = true;
            }
        }

        if ("LOAD".equals(aluOp) || "STORE".equals(aluOp)) {
            mdr = rm;
            mar = rz;
        } else {
            mar = null;
        }

    }

    public void memoryAccess() {
        if(mar!=null) {
            // Convert MAR to integer memory address
            int address = Integer.parseUnsignedInt(mar.substring(2), 16);

            if (memRead != null && memRead) { // Load instruction
                StringBuilder loadedValue = new StringBuilder();

                // Read memory byte-by-byte
                switch (size) {
                    case "BYTE":
                        loadedValue.append(memory.getOrDefault(String.format("0x%08X", address), "00"));
                        break;
                    case "HALF":
                        for (int i = 0; i < 2; i++) { // Read 2 bytes
                            loadedValue.insert(0, memory.getOrDefault(String.format("0x%08X", address + i), "00"));
                        }
                        break;
                    case "WORD":
                        for (int i = 0; i < 4; i++) { // Read 4 bytes
                            loadedValue.insert(0, memory.getOrDefault(String.format("0x%08X", address + i), "00"));
                        }
                        break;
                    case "DOUBLE":
                        for (int i = 0; i < 8; i++) { // Read 8 bytes
                            loadedValue.insert(0, memory.getOrDefault(String.format("0x%08X", address + i), "00"));
                        }
                        break;
                    default:
                        System.out.println("Error: Invalid memory size for load.");
                        return;
                }

                mdr = "0x" + loadedValue.toString().toUpperCase(); // Store value in MDR
                System.out.println("Loaded Value (MDR): " + mdr + " from Address (MAR): " + mar);
            }

            if (memWrite != null && memWrite) { // Store instruction
                if (mdr == null) {
                    System.out.println("Error: MDR (Memory Data Register) is null.");
                    return;
                }

                String value = mdr.substring(2); // Remove "0x" prefix

                // Store memory byte-by-byte
                switch (size) {
                    case "BYTE":
                        memory.put(String.format("0x%08X", address), value.substring(value.length() - 2)); // Last 2 chars
                        break;
                    case "HALF":
                        for (int i = 0; i < 2; i++) { // Store 2 bytes
                            memory.put(String.format("0x%08X", address + i), value.substring(value.length() - (2 * (i + 1)), value.length() - (2 * i)));
                        }
                        break;
                    case "WORD":
                        for (int i = 0; i < 4; i++) { // Store 4 bytes
                            memory.put(String.format("0x%08X", address + i), value.substring(value.length() - (2 * (i + 1)), value.length() - (2 * i)));
                        }
                        break;
                    case "DOUBLE":
                        for (int i = 0; i < 8; i++) { // Store 8 bytes
                            memory.put(String.format("0x%08X", address + i), value.substring(value.length() - (2 * (i + 1)), value.length() - (2 * i)));
                        }
                        break;
                    default:
                        System.out.println("Error: Invalid memory size for store.");
                        return;
                }

                System.out.println("Stored Value (MDR): " + mdr + " to Address (MAR): " + mar);
            }

        }
    }

    public void writeBack() {
        if (regWrite == null || !regWrite) {
            System.out.println("Skipping WriteBack: regWrite is disabled.");
            return;
        }

        if (rd == null || rd.equals("00000")) { // x0 should not be modified
            System.out.println("Skipping WriteBack: Destination register is x0.");
            return;
        }

        if (muxY == 0) {
            ry = rz;
        } else if (muxY == 1) {
            ry = mdr;
        } else if (muxY == 2) {
            ry = pcTemp;
        }

        String registerName = "x" + Integer.parseInt(rd, 2);
        registerFile.put(registerName, ry);
        System.out.println("WriteBack: Register " + registerName + " updated with " + ry);
    }

    public void completeExecution() {
        
        while (true) {
            // Fetch the instruction
            fetch();
            if (ir == null || ir.equals("0x00000000")) {
                System.out.println("Terminating: No instruction (NOP or NULL) found.");
                break;
            }

            // Decode the instruction
            decode();

            // Execute the instruction
            execute();

            // Memory access stage if needed
            memoryAccess();

            // Write back to register if needed
            writeBack();

            // Prompt user to continue to next step
            System.out.println("--------------------------------------------------");

            if (clock > 5000) { // Safety limit to prevent infinite loops
                System.err.println("Error: Maximum clock cycles exceeded.");
                break;
            }
        }


        System.out.println("Register File State:");
        TreeMap<Integer, String> sortedRegs = new TreeMap<>();
        for (int i = 0; i < 32; i++) {
            sortedRegs.put(i, registerFile.get("x" + i));
        }
        for (Map.Entry<Integer, String> entry : sortedRegs.entrySet()) {
            System.out.printf("  x%d: %s ", entry.getKey(), entry.getValue());
            if ((entry.getKey() + 1) % 4 == 0) System.out.println(); // Newline every 4 registers
        }
        if (sortedRegs.size() % 4 != 0) System.out.println(); // Ensure final newline
        TreeMap<String, String> sortedMap = new TreeMap<>(memory);
        System.out.println("\nFinal Memory State:");
        for (String addr : sortedMap.keySet()) {
        System.out.println(addr + ": " + sortedMap.get(addr));
        }
    }

    public void parseMachineCodeFromFile(String filePath) {
        HashMap<String, String> textSegment = new HashMap<>();
        HashMap<String, String> memoryMap = new HashMap<>();
        boolean isMemorySection = false;

        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {
            String line;

            while ((line = br.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#"))
                    continue;

                String[] parts = line.split("\\s+", 3);
                if (parts.length >= 2) {
                    String pc = parts[0];
                    String instruction = parts[1];

                    // Detect end of instructions section
                    if (instruction.equalsIgnoreCase("0xdeadbeef")) {
                        try {
                            int pcInt = Integer.parseUnsignedInt(pc.replace("0x", ""), 16);
                            pc = String.format("0x%08X", pcInt);
                        } catch (NumberFormatException ignored) {
                        }
                        textSegment.put(pc, instruction.toUpperCase());
                        isMemorySection = true;
                        continue;
                    }

                    if (!isMemorySection) {
                        if (pc.startsWith("0x")) {
                            int pcInt = Integer.parseUnsignedInt(pc.replace("0x", ""), 16);
                            pc = String.format("0x%08X", pcInt);
                            textSegment.put(pc, instruction.toUpperCase());

                            // Add instruction bytes to memory map (little endian)
                            String instrHex = instruction.replace("0x", "").toUpperCase();
                            instrHex = String.format("%8s", instrHex).replace(' ', '0'); // pad to 8 digits

                            for (int i = 0; i < 4; i++) {
                                String byteHex = instrHex.substring(6 - i * 2, 8 - i * 2);
                                String byteAddress = String.format("0x%08X", pcInt + i);
                                memoryMap.put(byteAddress, byteHex);
                            }
                        }
                    } else {
                        if (pc.startsWith("0x") && instruction.startsWith("0x")) {
                            memoryMap.put("0x" + pc.replace("0x", "").toUpperCase(),
                                    instruction.replace("0x", "").toUpperCase());
                        }
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        setTextSegment(textSegment);
        memory = memoryMap;
        System.out.println("Parsing done.");
    }

    public static void main(String[] args) {
        if (args.length != 1) {
            System.out.println("Usage: java Assembler <output file>");
            return;
        }
        
        String outputFile = args[0];

        Execution cpu = new Execution();
        cpu.parseMachineCodeFromFile(outputFile);
        cpu.completeExecution();
    }

}