import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Request,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/users/roles.enum';
import { ShareProjectDto } from './dto/shared-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TransferOwnerDto } from './dto/transferowner.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { updateShareProjectDto } from './dto/update-share.dto';

@ApiTags('projects')
@ApiBearerAuth()
// All routes in this controller require a valid JWT token
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  // POST /projects
  // Creates a new project for the authenticated user
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  createProject(
    @Request() req: ExpressRequest,
    @Body() body: CreateProjectDto,
  ) {
    return this.projectService.create({ ...body, owner: req.user.sub });
  }

  @Get(':id')
  getProjectById(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.projectService.findByIdWithAccess(id, {
      userId: req.user.sub,
      role: req.user.role,
    });
  }

  @Patch(':id')
  updateProject(
    @Param('id') id: string,
    @Request() req: ExpressRequest,
    @Body()
    updateData: UpdateProjectDto,
  ) {
    const { sub, role } = req.user;
    return this.projectService.updateProject(id, { sub, role }, updateData);
  }

  // GET /projects?page=1&limit=10&search=query
  // Returns paginated list of projects owned by the authenticated user
  @Get()
  getUserProjects(
    @Request() req: ExpressRequest,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.projectService.findAll(req.user.sub, +page, +limit, search);
  }

  // POST /projects/share
  // Shares a project with another user and assigns permissions
  @Post('share')
  @ApiOperation({
    summary: 'Share a project with another user and assign permissions',
  })
  @ApiResponse({ status: 201, description: 'Project shared' })
  shareProject(@Body() body: ShareProjectDto) {
    return this.projectService.shareProject(body);
  }

  @Get('admin/all')
  @Roles(Role.Admin)
  getAllProjectsForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    return this.projectService.findAllProjectsForAdmin(+page, +limit, search);
  }

  @Patch(':id/transfer-owner')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Transfer project ownership' })
  @ApiResponse({ status: 200, description: 'Ownership transferred' })
  transferOwner(
    @Param('id') projectId: string,
    @Body() body: TransferOwnerDto,
  ) {
    return this.projectService.transferOwnership(projectId, body);
  }

  @Patch(':id/share')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Share project with user' })
  @ApiParam({
    name: 'id',
    description: 'Project ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @ApiBody({ type: ShareProjectDto })
  @ApiOkResponse({ description: 'Project shared successfully' })
  @ApiNotFoundResponse({ description: 'Project not found' })
  async shareProjectWithUpdate(
    @Param('id') projectId: string,
    @Body() shareProjectDto: updateShareProjectDto,
  ) {
    return this.projectService.shareProjectWithUser(projectId, shareProjectDto);
  }

  @Get('by-tag/:tag')
  @ApiOperation({ summary: 'List all projects by tag (category)' })
  @ApiResponse({ status: 200, description: 'Projects with the given tag' })
  getProjectsByTag(@Param('tag') tag: string) {
    return this.projectService.findByTag(tag);
  }
}
