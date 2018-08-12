#pragma warning(disable : 4996)

#include <Windows.h>
#include <conio.h>

#include <iostream>
#include <string>

#define MAX_OPERAND_LENGTH 4

typedef unsigned char byte;
typedef void(*pFunc)(void);
union Function
{
	pFunc execute;
	byte* payload;
};

void pause()
{
	std::cout << "Press any key to exit...";
	getch();
}

bool fetchInt(std::string& str, size_t& strLen, size_t& iterator, int& out)
{
	char buffer[MAX_OPERAND_LENGTH];
	int i;
	for (i = 0; i < MAX_OPERAND_LENGTH; i++)
	{
		while (str[iterator] == ' ' && iterator < strLen)
		{
			iterator++;
		}
		if (iterator >= strLen)
		{
			break;
		}
		char temp = str[iterator];
		if (temp < 48 || temp > 57)
		{
			break;
		}
		buffer[i] = temp - 48;
		iterator++;
	}
	if (i == 0)
	{
		std::cout << "Unexpected character or end of input at position " << iterator << std::endl;
		return false;
	}
	out = 0;
	for (int j = 0; j < i; j++)
	{
		out *= 10;
		out += (int)buffer[j];
	}
	return true;
}

int main()
{
	// Startup
	SetConsoleTitle(TEXT("JIT Compiling Calculator"));
	std::cout << "This is probably the most useless tool ever" << std::endl;
	std::cout << "It can only do 1 to 4 digits multiplication, enter something like \"125 * 20\" and see if it works" << std::endl;

	// Get user input
	std::string str;
	std::getline(std::cin, str);

	// Prepare variables
	size_t iterator = 0;
	size_t strLen = str.length();
	int op1, op2;
	int JITReturn;

	// Prepare JIT payload buffer
	// http://ref.x86asm.net/coder32.html
	byte* payload = (byte*)VirtualAllocEx(GetCurrentProcess(), 0, 512, MEM_COMMIT, PAGE_EXECUTE_READWRITE);

	// Check if memory allocation succeeded
	if (payload == NULL)
	{
		//Failed, can't even get 512 bytes of memory...
		std::cout << "Could not allocate JIT memory" << std::endl;
		pause();
		return 1;
	}
	else
	{
		byte* p = payload;

		// Prepare
		*p++ = 0x50; // Push EAX
		*p++ = 0x52; // Push EDX

		// Put in first operand
		*p++ = 0xA1; // Mov EAX, (operand1)
		if (!fetchInt(str, strLen, iterator, op1))
		{
			pause();
			return 1;
		}
		(int*&)p[0] = &op1; p += sizeof(int*);

		// Move it over
		*p++ = 0x92; // Xchg EDX, EAX

		// Get operator
		while (str[iterator] == ' ' && iterator < strLen)
		{
			iterator++;
		}
		if (iterator >= strLen || str[iterator] != '*')
		{
			// Only multiplication is supported
			std::cout << "Unexpected character or end of input at position " << iterator << std::endl;
			pause();
			return 1;
		}
		iterator++;

		// Put in second operand
		*p++ = 0xA1; // Mov EAX, (operand2)
		if (!fetchInt(str, strLen, iterator, op2))
		{
			pause();
			return 1;
		}
		(int*&)p[0] = &op2; p += sizeof(int*);

		// Do multiplication
		*p++ = 0xF7; *p++ = 0xEA; //Imul EDX

		// Return result
		*p++ = 0xA3; // Mov (JITReturn), EAX
		(int*&)p[0] = &JITReturn; p += sizeof(int*);

		// Clean up
		*p++ = 0x5A; //Pop EDX
		*p++ = 0x58; //Pop EAX
		*p++ = 0xC3; //Ret

		// Execute payload
		Function f;
		f.payload = payload;
		f.execute();

		// Print result
		std::cout << JITReturn << std::endl;
		pause();
		return 0;
	}
}
